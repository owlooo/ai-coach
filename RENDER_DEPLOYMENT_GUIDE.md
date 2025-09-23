# 🚀 Render 배포 가이드

## 📋 사전 준비사항

### 1. GitHub 저장소 준비
- 프로젝트를 GitHub에 푸시
- 모든 파일이 올바르게 커밋되었는지 확인

### 2. 필요한 API 키 준비
- OpenAI API 키
- Firebase 프로젝트 설정

## 🎯 단계별 배포 과정

### 1단계: Render 계정 생성
1. https://render.com 접속
2. **Sign Up** 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 웹 서비스 생성
1. **Dashboard**에서 **New +** 클릭
2. **Web Service** 선택
3. GitHub 저장소 연결

### 3단계: 서비스 설정
```
Name: ai-interview-coach-backend
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: chmod +x start.sh && ./start.sh
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
- **Auto-Deploy**: Yes (GitHub 푸시 시 자동 배포)
- **Health Check Path**: `/api/health`
- **Instance Type**: Free (무료 티어)

## 🔧 프론트엔드 배포 (선택사항)

### Static Site로 배포
1. **New +** → **Static Site** 선택
2. GitHub 저장소 연결
3. 설정:
   ```
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```

### 환경 변수 (프론트엔드)
```
VITE_API_BASE_URL = https://your-backend-url.onrender.com
VITE_FIREBASE_API_KEY = your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your-project-id
VITE_FIREBASE_STORAGE_BUCKET = your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID = 1:123456789:web:abcdef123456
```

## 🚨 주의사항

### 슬리핑 모드
- **무료 티어**: 15분 비활성 시 자동 종료
- **첫 요청**: 30초~1분 소요 (웨이크업 시간)
- **해결책**: 유료 플랜 ($7/월)으로 업그레이드

### 파일 크기 제한
- **무료 티어**: 1GB 스토리지
- **YOLO 모델**: 약 6MB (문제없음)

### 빌드 시간
- **무료 티어**: 최대 90분
- **의존성 설치**: 약 5-10분 소요

## 🔍 배포 후 확인사항

### 1. 헬스체크
```
https://your-app.onrender.com/api/health
```

### 2. API 문서
```
https://your-app.onrender.com/docs
```

### 3. 로그 확인
- Render 대시보드 → **Logs** 탭

## 🛠️ 문제 해결

### 일반적인 오류들

#### 1. ModuleNotFoundError
```bash
# 해결책: PYTHONPATH 설정 확인
PYTHONPATH = /opt/render/project/src/backend
```

#### 2. CORS 오류
```bash
# 해결책: ALLOWED_ORIGINS 설정
ALLOWED_ORIGINS = ["https://your-frontend-url.onrender.com"]
```

#### 3. Firebase 연결 오류
```bash
# 해결책: 서비스 계정 키 파일 확인
# firebase-service-account.json 파일이 올바른 위치에 있는지 확인
```

#### 4. 빌드 실패
```bash
# 해결책: requirements.txt 확인
# 모든 의존성이 올바르게 명시되었는지 확인
```

## 📞 지원

문제가 발생하면:
1. Render 로그 확인
2. GitHub Issues 생성
3. Render 지원팀 문의

## 🎉 배포 완료!

배포가 성공하면 다음과 같은 URL을 받게 됩니다:
- **백엔드**: `https://ai-interview-coach-backend.onrender.com`
- **프론트엔드**: `https://ai-interview-coach-frontend.onrender.com`

축하합니다! 🎊
