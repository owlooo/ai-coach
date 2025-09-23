# AI Interview Coach Backend

FastAPI 기반 백엔드 서버입니다.

## 주요 기능

- **자소서 분석**: PDF 업로드 및 AI 분석
- **면접 질문 생성**: 자소서 기반 예상 질문 생성
- **답변 평가**: 면접 답변 AI 평가
- **행동 분석**: 이미지 기반 행동 분석

## 설치 및 실행

### 1. Python 가상환경 생성
```bash
python -m venv venv
```

### 2. 가상환경 활성화
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 환경 변수 설정
`.env` 파일에 OpenAI API 키를 설정하세요:
```env
OPENAI_API_KEY=your_actual_api_key_here
```

### 5. 개발 서버 실행
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 문서

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 주요 엔드포인트

- `POST /api/resume/analyze` - 자소서 분석
- `POST /api/resume/generate-questions` - 질문 생성
- `POST /api/interview/evaluate-answer` - 답변 평가
- `POST /api/behavior/analyze` - 행동 분석
- `GET /api/health` - 서버 상태 확인
