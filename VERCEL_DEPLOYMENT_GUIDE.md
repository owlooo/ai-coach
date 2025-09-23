# 🚀 Vercel 배포 가이드

## 📋 사전 준비사항

1. **Vercel 계정**: https://vercel.com
2. **GitHub 저장소**: `owlooo/cursor` 브랜치 `AI_Interview_Coach_NLP_v01`
3. **OpenAI API 키**: `sk-`로 시작하는 키
4. **Firebase 프로젝트**: Storage Bucket 이름

## 🎯 Vercel 배포 단계

### 1단계: Vercel 계정 생성
- https://vercel.com 접속
- GitHub 계정으로 로그인

### 2단계: 프로젝트 가져오기
1. **New Project** 클릭
2. **Import Git Repository** → `owlooo/cursor` 선택
3. **Branch**: `AI_Interview_Coach_NLP_v01` 선택
4. **Framework Preset**: Other 선택

### 3단계: 프로젝트 설정
```
Project Name: ai-interview-coach
Root Directory: ./
Build Command: (자동 감지)
Output Directory: frontend/dist
Install Command: (자동 감지)
```

### 4단계: 환경 변수 설정
**Environment Variables** 탭에서 다음 변수들 추가:

```
OPENAI_API_KEY = sk-your-openai-key-here
OPENAI_MODEL = gpt-4o-mini
VITE_API_BASE_URL = https://ai-interview-coach.vercel.app
FIREBASE_STORAGE_BUCKET = your-project.firebasestorage.app
ENABLE_YOLO = false
DEBUG = false
```

### 5단계: 고급 설정
- **Functions**: Python 함수 최대 실행 시간 30초
- **Builds**: 프론트엔드와 백엔드 동시 빌드

## 🔧 Vercel 설정 파일 (vercel.json)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/app/main.py",
      "use": "@vercel/python"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/app/main.py"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/dist/$1"
    }
  ],
  "env": {
    "ENABLE_YOLO": "false",
    "DEBUG": "false"
  }
}
```

## 🚨 주의사항

### YOLO 모델 비활성화
- **ENABLE_YOLO = false**: YOLO 모델 로드하지 않음
- **포즈 분석 기능**: 비활성화됨 (다른 기능은 정상 작동)
- **파일 크기**: 대폭 감소 (6MB 모델 제외)

### Vercel 제한사항
- **함수 실행 시간**: 최대 30초
- **파일 크기**: 최대 50MB
- **메모리**: 1GB
- **콜드 스타트**: 첫 요청 시 지연 가능

## 🔍 문제 해결

### 일반적인 오류들:

#### 1. Build 실패
```bash
# 해결책: vercel.json 확인
# 빌드 설정이 올바른지 확인
```

#### 2. 환경 변수 오류
```bash
# 해결책: Vercel 대시보드에서 환경 변수 확인
# 모든 필수 변수가 설정되었는지 확인
```

#### 3. API 라우팅 오류
```bash
# 해결책: routes 설정 확인
# /api/* 경로가 올바르게 설정되었는지 확인
```

#### 4. 함수 타임아웃
```bash
# 해결책: maxDuration 설정 확인
# 복잡한 작업은 백그라운드로 처리
```

## 📞 지원

문제가 발생하면:
1. Vercel 로그 확인
2. GitHub Issues 생성
3. Vercel 지원팀 문의

## 🎉 배포 완료!

성공하면 다음과 같은 URL을 받게 됩니다:
- **웹사이트**: `https://ai-interview-coach.vercel.app`
- **API**: `https://ai-interview-coach.vercel.app/api/health`
- **API Docs**: `https://ai-interview-coach.vercel.app/api/docs`

## 🔄 자동 배포

GitHub에 푸시할 때마다 자동으로 배포됩니다:
```bash
git add .
git commit -m "새로운 기능 추가"
git push cursor AI_Interview_Coach_NLP_v01
# → Vercel이 자동으로 새 버전을 배포합니다!
```

축하합니다! 🎊
