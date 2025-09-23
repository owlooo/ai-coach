# Render 환경 변수 설정 가이드

## 🔧 필요한 환경 변수들

### 1. OpenAI API 키
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Firebase 설정
```
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 📝 Render에서 환경 변수 설정하는 방법

### 1. Render 대시보드 접속
- https://dashboard.render.com 접속
- 프로젝트 선택

### 2. 환경 변수 추가
1. **Environment** 탭 클릭
2. **Add Environment Variable** 클릭
3. 각 변수 추가:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-key-here`
   - **Type**: `Plain Text` 선택

### 3. Firebase 서비스 계정 키
Firebase 서비스 계정 키는 보안상 환경 변수로 직접 설정하지 않고, 코드에서 직접 로드하도록 설정되어 있습니다.

## 🚨 주의사항

1. **API 키 보안**: 실제 API 키를 공개 저장소에 올리지 마세요
2. **CORS 설정**: 프론트엔드 URL을 정확히 설정하세요
3. **파일 크기**: Render 무료 티어는 파일 크기 제한이 있습니다

## 🔍 문제 해결

### 일반적인 오류들:
- `ModuleNotFoundError`: PYTHONPATH 설정 확인
- `CORS Error`: ALLOWED_ORIGINS 설정 확인
- `Firebase Error`: 서비스 계정 키 파일 확인
