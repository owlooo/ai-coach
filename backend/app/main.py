from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
from dotenv import load_dotenv

from app.routes import resume, interview, questions, behavior
from app.utils.config import get_settings

# 환경 변수 로드
load_dotenv()

# 설정 로드
settings = get_settings()

# FastAPI 앱 생성
app = FastAPI(
    title="AI Interview Coach API",
    description="AI 면접 코치 서비스 백엔드 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(behavior.router, prefix="/api/behavior", tags=["behavior"])

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

@app.get("/favicon.ico")
async def favicon():
    # favicon 요청에 대해 빈 응답 반환 (404 오류 방지)
    return JSONResponse(content={}, status_code=200)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "Something went wrong"
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
