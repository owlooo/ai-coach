from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # 서버 설정
    DEBUG: bool = True
    PORT: int = 8000
    
    # CORS 설정
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ]
    
    # OpenAI 설정
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # 파일 업로드 설정
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Firebase 설정
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    FIREBASE_STORAGE_BUCKET: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # 추가 환경변수 허용

def get_settings():
    return Settings()
