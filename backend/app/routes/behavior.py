from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import io
import base64
from app.services.pose_analysis_service import pose_analysis_service

router = APIRouter()

@router.post("/analyze")
async def analyze_behavior(file: UploadFile = File(...)):
    """업로드된 이미지에서 행동을 분석합니다."""
    try:
        # 이미지 파일 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail="이미지 파일만 업로드 가능합니다."
            )
        
        # 파일 읽기
        content = await file.read()
        
        # 포즈 분석 서비스로 분석
        result = await pose_analysis_service.analyze_frame(content)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": result["success"],
                "data": {
                    "events": result.get("events", []),
                    "counts": result.get("counts", {}),
                    "feedback": result.get("feedback", []),
                    "keypoints_detected": result.get("keypoints_detected", False),
                    "torso_length": result.get("torso_length", 0),
                    "error": result.get("error")
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"행동 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/analyze-video")
async def analyze_video_behavior(video_file: UploadFile = File(...)):
    """업로드된 비디오 파일에서 행동을 분석합니다."""
    try:
        # 비디오 파일 검증
        if not video_file.content_type.startswith("video/"):
            raise HTTPException(
                status_code=400, 
                detail="비디오 파일만 업로드 가능합니다."
            )
        
        # 임시 파일로 저장
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{video_file.filename.split('.')[-1]}") as temp_file:
            content = await video_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # 포즈 분석 서비스로 분석
            result = await pose_analysis_service.analyze_video_file(temp_file_path)
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": result["success"],
                    "data": {
                        "events": result.get("events", []),
                        "counts": result.get("counts", {}),
                        "feedback": result.get("feedback", []),
                        "video_info": result.get("video_info", {}),
                        "error": result.get("error")
                    }
                }
            )
            
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"비디오 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/analyze-frame")
async def analyze_frame_behavior(frame_data: str):
    """실시간 프레임 분석 (base64 인코딩된 이미지)"""
    try:
        # base64 디코딩
        try:
            # data:image/jpeg;base64, 부분 제거
            if ',' in frame_data:
                frame_data = frame_data.split(',')[1]
            
            frame_bytes = base64.b64decode(frame_data)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"이미지 디코딩 실패: {str(e)}"
            )
        
        # 포즈 분석 서비스로 분석
        result = await pose_analysis_service.analyze_frame(frame_bytes)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": result["success"],
                "data": {
                    "events": result.get("events", []),
                    "counts": result.get("counts", {}),
                    "feedback": result.get("feedback", []),
                    "keypoints_detected": result.get("keypoints_detected", False),
                    "torso_length": result.get("torso_length", 0),
                    "error": result.get("error")
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"프레임 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/reset-analysis-state")
async def reset_analysis_state():
    """분석 상태 초기화"""
    try:
        pose_analysis_service.reset_state()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "분석 상태가 초기화되었습니다."
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"상태 초기화 중 오류가 발생했습니다: {str(e)}"
        )
