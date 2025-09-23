from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/categories")
async def get_question_categories():
    """면접 질문 카테고리를 반환합니다."""
    categories = [
        {"id": 1, "name": "자기소개 및 지원동기", "description": "기본적인 자기소개와 지원 동기에 관한 질문"},
        {"id": 2, "name": "경험 및 성과", "description": "과거 경험과 성과에 관한 질문"},
        {"id": 3, "name": "직무 관련 역량", "description": "직무 수행 능력과 전문성에 관한 질문"},
        {"id": 4, "name": "상황 대처 능력", "description": "문제 해결 능력과 위기 대응에 관한 질문"},
        {"id": 5, "name": "성장 및 발전 계획", "description": "미래 계획과 성장 의지에 관한 질문"}
    ]
    
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "data": categories
        }
    )
