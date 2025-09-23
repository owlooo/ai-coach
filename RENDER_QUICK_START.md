# 🚀 Render 빠른 배포 가이드

## 📋 사전 준비사항

1. **GitHub 저장소**: `owlooo/cursor` 브랜치 `AI_Interview_Coach_NLP_v01`
2. **OpenAI API 키**: `sk-`로 시작하는 키
3. **Firebase 프로젝트**: Storage Bucket 이름

## 🎯 Render 배포 단계

### 1단계: Render 계정 생성
- https://render.com 접속
- GitHub 계정으로 로그인

### 2단계: 새 웹 서비스 생성
1. **New +** → **Web Service** 클릭
2. **Connect GitHub** → `owlooo/cursor` 선택
3. **Branch**: `AI_Interview_Coach_NLP_v01` 선택

### 3단계: 서비스 설정
```
Name: ai-interview-coach-api
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 4단계: 환경 변수 설정
**Environment** 탭에서 다음 변수들 추가:

```
PYTHONPATH = /opt/render/project/src/backend
DEBUG = False
OPENAI_API_KEY = sk-your-openai-key-here
FIREBASE_STORAGE_BUCKET = your-project.firebasestorage.app
ALLOWED_ORIGINS = ["*"]
```

### 5단계: 고급 설정
- **Auto-Deploy**: Yes
- **Health Check Path**: `/api/health`
- **Instance Type**: Free

## 🔧 문제 해결

### 일반적인 오류들:

#### 1. Build 실패
```bash
# 해결책: requirements.txt 확인
# 모든 의존성이 올바르게 명시되었는지 확인
```

#### 2. ModuleNotFoundError
```bash
# 해결책: PYTHONPATH 설정 확인
PYTHONPATH = /opt/render/project/src/backend
```

#### 3. Firebase 연결 오류
```bash
# 해결책: 환경 변수 확인
FIREBASE_STORAGE_BUCKET = your-project.firebasestorage.app
```

#### 4. CORS 오류
```bash
# 해결책: ALLOWED_ORIGINS 설정
ALLOWED_ORIGINS = ["*"]
```

## 📞 지원

문제가 발생하면:
1. Render 로그 확인
2. GitHub Issues 생성
3. Render 지원팀 문의

## 🎉 배포 완료!

성공하면 다음과 같은 URL을 받게 됩니다:
- **API**: `https://ai-interview-coach-api.onrender.com`
- **Health Check**: `https://ai-interview-coach-api.onrender.com/api/health`
- **API Docs**: `https://ai-interview-coach-api.onrender.com/docs`

축하합니다! 🎊
