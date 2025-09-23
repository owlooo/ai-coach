# AI 면접 코치 서비스

자기소개서를 기반으로 한 AI 면접 시뮬레이션 서비스입니다.

## 주요 기능

### 1. 로그인/회원관리
- Supabase Auth 기반 이메일·비밀번호 로그인
- 회원가입 및 인증 관리

### 2. 자기소개서 분석
- PDF 파일 업로드 및 텍스트 추출
- GPT 기반 내용·구조·표현 피드백
- 예상 질문 생성 (카테고리별 5~10개)

### 3. 면접 시뮬레이션
- 브라우저 TTS로 질문 읽기
- 답변 녹음 및 STT 변환
- LLM 기반 답변 평가 (구체성·직무적합·논리·STAR)
- 실시간 프레임 캡처 및 YOLO 행동 분석

### 4. 결과 리포트
- 종합 점수 및 카테고리별 분석
- 질문별 상세 피드백
- 행동 분석 결과 (자리 비움/시선 이탈)
- 개선 권장사항 제공

### 5. 기록 관리
- 면접 세션별 기록 저장
- 성장 추적 및 통계
- 리포트 다운로드 기능

## 기술 스택

### 프론트엔드
- **React 18** - UI 프레임워크
- **Vite** - 빌드 도구
- **Tailwind CSS** - 스타일링
- **React Router** - 라우팅
- **Recharts** - 차트 라이브러리
- **React Dropzone** - 파일 업로드
- **React Webcam** - 웹캠 통합

### 백엔드 연동
- **Firebase Authentication** - 사용자 인증
- **Firestore** - 실시간 데이터베이스
- **Firebase Storage** - 파일 저장소
- **Web Speech API** - TTS 기능
- **MediaRecorder API** - 음성 녹음
- **Canvas API** - 프레임 캡처

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication에서 이메일/비밀번호 로그인 활성화
3. Firestore Database 생성 (테스트 모드)
4. Storage 활성화

### 3. 환경 변수 설정
`.env` 파일을 생성하고 Firebase 설정을 추가하세요:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_API_BASE_URL=http://localhost:8000
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 빌드
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── Layout.jsx      # 메인 레이아웃
├── contexts/           # React Context
│   └── AuthContext.jsx # 인증 상태 관리
├── lib/               # 유틸리티 및 설정
│   ├── firebase.js    # Firebase 클라이언트
│   ├── database.js    # Firestore 서비스
│   └── storage.js     # Firebase Storage 서비스
├── pages/             # 페이지 컴포넌트
│   ├── Login.jsx      # 로그인 페이지
│   ├── Dashboard.jsx  # 대시보드
│   ├── ResumeUpload.jsx # 자소서 업로드
│   ├── InterviewSimulation.jsx # 면접 시뮬레이션
│   ├── Results.jsx    # 결과 리포트
│   └── History.jsx    # 기록 조회
├── App.jsx            # 메인 앱 컴포넌트
├── main.jsx           # 앱 진입점
└── index.css          # 글로벌 스타일
```

## 주요 페이지

### 1. 로그인 페이지 (`/login`)
- 이메일/비밀번호 로그인
- 회원가입 기능
- 반응형 디자인

### 2. 대시보드 (`/`)
- 서비스 개요 및 통계
- 주요 기능 안내
- 빠른 시작 가이드

### 3. 자기소개서 분석 (`/resume`)
- PDF 드래그 앤 드롭 업로드
- 실시간 분석 진행 상황
- 피드백 및 예상 질문 표시

### 4. 면접 시뮬레이션 (`/interview`)
- 질문별 진행 상황 표시
- TTS 질문 재생
- 실시간 녹음 및 분석
- 행동 분석 모니터링

### 5. 결과 리포트 (`/results`)
- 종합 점수 및 차트
- 질문별 상세 피드백
- 행동 분석 결과
- 개선 권장사항

### 6. 기록 조회 (`/history`)
- 면접 세션 목록
- 검색 및 정렬 기능
- 상세 기록 보기
- 리포트 다운로드

## Firebase 데이터 구조

### Firestore 컬렉션
```
users/{userId}/
├── resumes/           # 자기소개서 분석 결과
├── interviews/        # 면접 세션 기록
└── questions/         # 예상 질문
```

### Firebase Storage 구조
```
users/{userId}/
├── resumes/           # PDF 파일
└── interviews/
    └── {interviewId}/
        ├── audio/     # 음성 녹음 파일
        └── frames/   # 행동 분석 이미지
```

## 백엔드 연동

현재 프론트엔드는 Firebase와 연동되어 있으며, 모의 데이터를 사용하고 있습니다. 실제 AI 분석 기능을 구현하려면 다음 API 엔드포인트가 필요합니다:

- `POST /api/analyze-resume` - 자소서 분석 (PDF 텍스트 추출 + GPT)
- `POST /api/generate-questions` - 예상 질문 생성
- `POST /api/evaluate-answer` - 답변 평가 (STT + LLM)
- `POST /api/analyze-behavior` - 행동 분석 (YOLO)

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 라이선스

MIT License
