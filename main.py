from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import time
import os
from dotenv import load_dotenv

from backend.app.routes import resume, interview, questions, behavior
from backend.app.utils.config import get_settings

# 환경 변수 로드
load_dotenv()

# 설정 로드
settings = get_settings()

# FastAPI 앱 생성
app = FastAPI(
    title="AI Interview Coach API",
    description="AI 면접 코치 서비스 백엔드 API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None
)

# 압축 미들웨어 추가
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS 설정 - 보안 강화
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,  # 1시간 캐시
)

# 요청 처리 시간 측정 미들웨어
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# 정적 파일 서빙 (업로드된 파일들)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
