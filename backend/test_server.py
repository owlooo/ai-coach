from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import PyPDF2
import io
import os
import uuid
from datetime import datetime

app = FastAPI(
    title="AI Interview Coach API",
    description="AI 면접 코치 서비스 백엔드 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Interview Coach API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "OK",
        "service": "AI Interview Coach API",
        "version": "1.0.0"
    }

@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """PDF 자소서를 업로드하고 AI 분석을 수행합니다."""
    try:
        # 파일 내용 읽기
        content = await file.read()
        
        # 파일 형식에 따라 텍스트 추출
        if file.content_type == "application/pdf":
            # PDF 텍스트 추출
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        else:
            # 텍스트 파일 처리
            try:
                text = content.decode('utf-8')
            except UnicodeDecodeError:
                try:
                    text = content.decode('cp949')  # 한글 인코딩
                    text = content.decode('cp949')  # 한글 인코딩
                except UnicodeDecodeError:
                    raise HTTPException(
                        status_code=400,
                        detail="텍스트 파일 인코딩을 처리할 수 없습니다."
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
        
        # 테스트용 분석 결과 생성
        text_length = len(text)
        word_count = len(text.split())
        
        analysis_result = f"""## 📊 전체 평가 (각 항목별 1-10점 + 상세 설명)

### 🎯 구체성 (Specificity)
**점수**: 7/10
**분석**: 자소서에서 구체적인 사례, 데이터, 수치가 포함되어 있는지 상세히 분석합니다. 현재 텍스트 길이는 {text_length}자이며, 단어 수는 {word_count}개입니다.
**예시**: "팀 프로젝트에서 3개월간 15명과 협업하여 매출 30% 증가"와 같은 구체적 사례가 있는지 확인해보세요.

### 🧠 논리성 (Logic)
**점수**: 8/10  
**분석**: 문단 간 연결성, 논리적 흐름, 근거와 결론의 일치성을 상세히 분석합니다. 자소서의 구조와 흐름을 확인해보세요.
**예시**: 문제상황 → 해결과정 → 결과 → 배움의 흐름이 논리적으로 연결되어 있는지 확인해보세요.

### ✍️ 표현력 (Expression)
**점수**: 6/10
**분석**: 문장 구조, 어휘 선택, 임팩트 있는 표현 사용 여부를 상세히 분석합니다. 표현력을 개선할 여지가 있습니다.
**예시**: "열심히 했습니다"보다 "체계적인 분석을 통해"와 같은 구체적 표현 사용을 권장합니다.

### 💼 직무적합성 (Job Relevance)
**점수**: 7/10
**분석**: 지원 직무와의 연관성, 핵심 역량 부각, 업무 적용 가능성을 상세히 분석합니다.
**예시**: 해당 직무에서 요구하는 스킬과 경험이 명확히 드러나는지 확인해보세요.

## 💡 강점 (각 강점별 상세 설명)

1. **구체적인 경험 기술**: 자소서에서 구체적인 경험과 성과를 잘 드러내고 있습니다.
   - **상세 설명**: 실제 경험을 바탕으로 한 구체적인 사례가 잘 포함되어 있습니다.
   - **구체적 예시**: 프로젝트 경험과 성과를 구체적으로 기술했습니다.

2. **논리적 구성**: 자소서의 전체적인 흐름과 구성이 논리적으로 잘 짜여져 있습니다.
   - **상세 설명**: 문제상황부터 해결과정, 결과까지의 흐름이 자연스럽습니다.
   - **구체적 예시**: STAR 기법을 활용한 경험 기술이 잘 되어 있습니다.

## 🔧 개선 사항 (각 개선점별 상세 분석)

1. **수치와 데이터 강화**: 더 구체적인 수치와 데이터를 포함하면 좋겠습니다.
   - **현재 상태**: 일부 성과에 대한 구체적인 수치가 부족합니다.
   - **문제점**: 정량적 성과가 부족하여 임팩트가 약할 수 있습니다.
   - **개선 방법**: "매출 30% 증가", "사용자 만족도 95% 달성" 등 구체적 수치를 추가하세요.
   - **기대 효과**: 더 설득력 있고 임팩트 있는 자소서가 될 것입니다.

2. **개인적 성장과 배움 강조**: 경험을 통한 개인적 성장과 배움을 더 강조하면 좋겠습니다.
   - **현재 상태**: 결과에 대한 기술은 있지만 개인적 성장 과정이 부족합니다.
   - **문제점**: 단순한 성과 나열에 그칠 수 있습니다.
   - **개선 방법**: 각 경험에서 무엇을 배웠고 어떻게 성장했는지 구체적으로 기술하세요.
   - **기대 효과**: 지원자의 성장 가능성과 학습 능력을 어필할 수 있습니다.

## 📝 예상 면접 질문 (카테고리별 구체적 질문)

### 🎯 자기소개/지원동기
- "자소서에 언급된 경험 중 가장 기억에 남는 것은 무엇인가요?"
- "이 회사를 지원한 구체적인 이유는 무엇인가요?"

### 💼 경험/성과 관련
- "자소서에 나온 프로젝트에서 가장 어려웠던 점과 해결 방법은 무엇인가요?"
- "팀 프로젝트에서 리더십을 발휘한 경험이 있나요?"

### 🧠 역량/가치관 관련  
- "어려운 상황에서 어떻게 문제를 해결하시나요?"
- "개발자로서 추구하는 가치는 무엇인가요?"

---
**📌 참고**: 이 분석은 테스트용 분석입니다."""
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "analysis": analysis_result,
                    "file_info": {
                        "original_name": file.filename,
                        "saved_name": saved_filename,
                        "file_id": file_id,
                        "file_size": file.size,
                        "upload_time": datetime.now().isoformat(),
                        "file_path": file_path
                    }
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"자소서 분석 중 오류가 발생했습니다: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
