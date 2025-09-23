#!/bin/bash

# Render 배포용 시작 스크립트
echo "Starting AI Interview Coach Backend..."

# 백엔드 디렉토리로 이동
cd backend

# 환경 변수 설정
export PYTHONPATH="/opt/render/project/src/backend:$PYTHONPATH"

# Gunicorn으로 서버 시작
exec gunicorn app.main:app \
    -w 2 \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:$PORT \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100
