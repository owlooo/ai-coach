from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
import PyPDF2
import io
import os
import uuid
from datetime import datetime
from app.services.ai_service import ai_service
from app.services.firebase_service import firebase_service
from app.utils.config import get_settings

router = APIRouter()
settings = get_settings()

@router.post("/analyze")
async def analyze_resume(file: UploadFile = File(...), user_id: str = Form("anonymous")):
    """PDF 자소서를 업로드하고 AI 분석을 수행합니다."""
    try:
        # 파일 크기 검증
        if file.size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail="파일 크기가 너무 큽니다. (최대 10MB)"
            )
        
        # 파일 형식 검증 (PDF 또는 텍스트 파일 허용)
        allowed_types = ["application/pdf", "text/plain", "application/octet-stream"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="PDF 또는 텍스트 파일만 업로드 가능합니다."
            )
        
        # 파일 내용 읽기
        content = await file.read()
        
        # 파일 형식에 따라 텍스트 추출
        if file.content_type == "application/pdf":
            # PDF 텍스트 추출
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            if not text.strip():
                raise HTTPException(
                    status_code=400, 
                    detail="PDF에서 텍스트를 추출할 수 없습니다."
                )
        else:
            # 텍스트 파일 처리
            try:
                text = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = content.decode('cp949')  # 한글 인코딩
                except UnicodeDecodeError:
                    raise HTTPException(
                        status_code=400,
                        detail="텍스트 파일 인코딩을 처리할 수 없습니다."
                    )
            
            if not text.strip():
                raise HTTPException(
                    status_code=400,
                    detail="텍스트 파일이 비어있습니다."
                )
        
        # 파일 저장
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 고유한 파일명 생성
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
        saved_filename = f"{file_id}.{file_extension}"
        file_path = os.path.join(upload_dir, saved_filename)
        
        # 파일 저장
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # AI 분석 수행
        analysis_result = await ai_service.analyze_resume(text)
        
        # Firebase Storage에 파일 업로드 (로그인한 사용자만)
        file_url = None
        if user_id != "anonymous":
            try:
                file_url = await firebase_service.upload_resume_file(content, file.filename, user_id)
                print(f"파일이 Firebase Storage에 업로드되었습니다: {file_url}")
            except Exception as e:
                print(f"Firebase Storage 업로드 실패: {e}")
                # Firebase 업로드 실패 시 로컬 저장으로 폴백
                file_url = file_path
        else:
            print(f"로그인하지 않은 사용자 - Firebase Storage 업로드 건너뜀 (사용자: {user_id})")
            file_url = file_path

        # 파일 정보 생성
        file_info = {
            "file_id": file_id,
            "original_name": file.filename,
            "saved_name": saved_filename,
            "file_url": file_url,
            "file_size": file.size,
            "upload_time": datetime.now().isoformat(),
            "content_type": file.content_type,
            "file_path": file_path
        }

        # Firebase Firestore에 분석 결과 저장 (로그인한 사용자만)
        firestore_id = None
        if user_id != "anonymous":
            try:
                resume_data = {
                    "fileName": file.filename,
                    "fileSize": file.size,
                    "analyzedAt": datetime.now().isoformat(),
                    "analysis": analysis_result,
                    "fileInfo": file_info,
                    "extractedText": text
                }
                firestore_id = await firebase_service.save_resume_analysis(resume_data, user_id)
                print(f"분석 결과가 Firestore에 저장되었습니다: {firestore_id}")
            except Exception as e:
                print(f"Firestore 저장 실패: {e}")
        else:
            print(f"로그인하지 않은 사용자 - Firestore 저장 건너뜀 (사용자: {user_id})")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "analysis": analysis_result,
                    "file_info": file_info,
                    "firestore_id": firestore_id
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"자소서 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/generate-questions")
async def generate_questions(request: dict):
    """자소서 분석 결과를 바탕으로 예상 면접 질문을 생성합니다."""
    try:
        resume_analysis = request.get("analysis", "")
        if not resume_analysis:
            raise HTTPException(
                status_code=400, 
                detail="자소서 분석 결과가 필요합니다."
            )
        
        questions = await ai_service.generate_questions(resume_analysis)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "questions": questions
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"질문 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/files")
async def get_uploaded_files():
    """업로드된 파일 목록을 조회합니다."""
    try:
        upload_dir = "uploads"
        if not os.path.exists(upload_dir):
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "files": []
                    }
                }
            )
        
        files = []
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            if os.path.isfile(file_path):
                file_stat = os.stat(file_path)
                files.append({
                    "filename": filename,
                    "size": file_stat.st_size,
                    "created_time": datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                    "file_path": file_path
                })
        
        # 생성 시간 역순으로 정렬
        files.sort(key=lambda x: x["created_time"], reverse=True)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "files": files
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"파일 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/files/{file_id}")
async def download_file(file_id: str):
    """업로드된 파일을 다운로드합니다."""
    try:
        upload_dir = "uploads"
        file_path = os.path.join(upload_dir, file_id)
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="파일을 찾을 수 없습니다."
            )
        
        from fastapi.responses import FileResponse
        return FileResponse(
            path=file_path,
            filename=file_id,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"파일 다운로드 중 오류가 발생했습니다: {str(e)}"
        )
