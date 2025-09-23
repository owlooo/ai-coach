from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.ai_service import ai_service
from app.services.firebase_service import firebase_service
import json
import os
from datetime import datetime
import openai
import tempfile

router = APIRouter()

@router.post("/generate-questions")
async def generate_questions(request: dict):
    """자기소개서를 바탕으로 면접 질문을 생성합니다."""
    try:
        resume_content = request.get("resume_content", "")
        question_count = request.get("question_count", 5)
        user_id = request.get("user_id", "anonymous")
        
        # 자기소개서 내용이 없으면 Firebase에서 최신 자기소개서 가져오기
        if not resume_content:
            try:
                print(f"사용자 ID로 자기소개서 검색: {user_id}")
                # 사용자의 최신 자기소개서 분석 기록 가져오기
                resume_history = await firebase_service.get_resume_history(user_id, limit=1)
                print(f"검색된 자기소개서 개수: {len(resume_history) if resume_history else 0}")
                
                if resume_history:
                    latest_resume = resume_history[0]
                    resume_content = latest_resume.get("extractedText", "")
                    print(f"Firebase에서 자기소개서 내용 가져옴: {len(resume_content)}자")
                else:
                    print("Firebase에서 자기소개서 데이터를 찾을 수 없음")
            except Exception as e:
                print(f"Firebase에서 자기소개서 가져오기 실패: {e}")
        
        if not resume_content:
            # 자기소개서가 없는 경우 기본 질문 사용
            basic_questions = [
                "자기소개를 해주세요",
                "지원하신 직무에 대한 동기를 말씀해주세요",
                "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요",
                "팀워크를 발휘했던 경험을 말씀해주세요",
                "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요"
            ]
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "questions": basic_questions,
                        "is_resume_based": False,
                        "message": "자기소개서 데이터가 없어 기본 질문을 사용합니다"
                    }
                }
            )
        
        # AI 서비스를 통해 자기소개서 기반 질문 생성
        questions = await ai_service.generate_interview_questions(resume_content, question_count)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "questions": questions,
                    "is_resume_based": True,
                    "message": "자기소개서를 바탕으로 맞춤 질문을 생성했습니다"
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"질문 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/generate-followup")
async def generate_followup_question(request: dict):
    """답변을 바탕으로 추가 질문을 생성합니다."""
    try:
        original_question = request.get("original_question", "")
        answer = request.get("answer", "")
        resume_content = request.get("resume_content", "")
        
        if not original_question or not answer:
            raise HTTPException(
                status_code=400, 
                detail="원래 질문과 답변이 필요합니다."
            )
        
        # AI 서비스를 통해 추가 질문 생성
        followup_question = await ai_service.generate_followup_question(
            original_question, answer, resume_content
        )
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "followup_question": followup_question
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"추가 질문 생성 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/evaluate-answer")
async def evaluate_answer(request: dict):
    """면접 답변을 평가합니다."""
    try:
        question = request.get("question", "")
        answer = request.get("answer", "")
        
        if not question or not answer:
            raise HTTPException(
                status_code=400, 
                detail="질문과 답변이 필요합니다."
            )
        
        evaluation = await ai_service.evaluate_answer(question, answer)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": evaluation
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"답변 평가 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/evaluate")
async def evaluate_interview(request: dict):
    """전체 면접을 평가합니다."""
    try:
        answers = request.get("answers", [])
        questions = request.get("questions", [])
        
        if not answers or not questions:
            raise HTTPException(
                status_code=400, 
                detail="답변과 질문이 필요합니다."
            )
        
        # 각 답변을 개별적으로 평가
        evaluations = []
        total_scores = {
            "specificity": 0,
            "jobRelevance": 0,
            "logic": 0,
            "starMethod": 0
        }
        
        for answer in answers:
            try:
                evaluation_result = await ai_service.evaluate_answer(answer["question"], answer["answer"])
                
                # AI 평가 결과에서 점수와 텍스트 추출
                scores = evaluation_result.get("scores", {
                    "specificity": 7,
                    "jobRelevance": 7,
                    "logic": 7,
                    "starMethod": 7
                })
                evaluation_text = evaluation_result.get("evaluation", "평가를 완료했습니다.")
                
                evaluations.append({
                    "question": answer["question"],
                    "answer": answer["answer"],
                    "evaluation": evaluation_text,
                    "scores": scores
                })
                
                # 점수 누적
                total_scores["specificity"] += scores["specificity"]
                total_scores["jobRelevance"] += scores["jobRelevance"]
                total_scores["logic"] += scores["logic"]
                total_scores["starMethod"] += scores["starMethod"]
                
            except Exception as e:
                print(f"개별 답변 평가 실패: {e}")
                evaluations.append({
                    "question": answer["question"],
                    "answer": answer["answer"],
                    "evaluation": "평가 중 오류가 발생했습니다.",
                    "scores": {
                        "specificity": 5,
                        "jobRelevance": 5,
                        "logic": 5,
                        "starMethod": 5
                    }
                })
                # 기본 점수 누적
                total_scores["specificity"] += 5
                total_scores["jobRelevance"] += 5
                total_scores["logic"] += 5
                total_scores["starMethod"] += 5
        
        # 평균 점수 계산
        num_answers = len(answers)
        avg_scores = {
            "specificity": round(total_scores["specificity"] / num_answers, 1),
            "jobRelevance": round(total_scores["jobRelevance"] / num_answers, 1),
            "logic": round(total_scores["logic"] / num_answers, 1),
            "starMethod": round(total_scores["starMethod"] / num_answers, 1)
        }
        
        overall_score = round(sum(avg_scores.values()) / len(avg_scores))
        
        # AI로 전체 피드백 생성
        try:
            ai_feedback = await ai_service.generate_overall_feedback(evaluations)
        except Exception as e:
            print(f"AI 피드백 생성 실패: {e}")
            ai_feedback = {
                "strengths": ["AI 평가를 통해 구체적인 강점을 파악했습니다"],
                "improvements": ["AI 평가를 통해 개선점을 파악했습니다"],
                "nextSteps": ["AI 피드백을 바탕으로 면접 실력을 향상시켜보세요"]
            }
        
        # Firebase Firestore에 면접 기록 저장
        firestore_id = None
        try:
            interview_data = {
                "answers": answers,
                "questions": questions,
                "completedAt": datetime.now().isoformat(),
                "evaluation": {
                    "scores": avg_scores,
                    "overallScore": overall_score,
                    "evaluations": evaluations,
                    "feedback": ai_feedback
                },
                "isResumeBased": request.get("isResumeBased", False),
                "overallScore": overall_score
            }
            user_id = request.get("user_id", "anonymous")
            print(f"면접 평가 - 사용자 ID: {user_id}")
            firestore_id = await firebase_service.save_interview_record(interview_data, user_id)
            if firestore_id:
                print(f"면접 기록이 Firestore에 저장되었습니다: {firestore_id} (사용자: {user_id})")
            else:
                print("Firebase 저장 실패 - 기본 응답으로 진행")
        except Exception as e:
            print(f"Firestore 저장 실패: {e}")
            firestore_id = None

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "scores": avg_scores,
                    "overallScore": overall_score,
                    "evaluations": evaluations,
                    "feedback": ai_feedback,
                    "firestore_id": firestore_id
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"면접 평가 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/speech-to-text")
async def speech_to_text(audio_file: UploadFile = File(...), user_id: str = "anonymous"):
    """음성 파일을 텍스트로 변환합니다."""
    try:
        print(f"STT 요청 - 사용자 ID: {user_id}")
        # 파일 확장자 확인
        if not audio_file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.webm', '.ogg')):
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 오디오 형식입니다. WAV, MP3, M4A, WEBM, OGG 파일을 사용해주세요."
            )
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.split('.')[-1]}") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # OpenAI Whisper API 사용
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if not openai_api_key:
                # API 키가 없으면 모의 응답
                return JSONResponse(
                    status_code=200,
                    content={
                        "success": True,
                        "data": {
                            "text": "음성 인식 기능을 사용하려면 OpenAI API 키가 필요합니다. 현재는 테스트 모드입니다.",
                            "confidence": 0.8
                        }
                    }
                )
            
            # OpenAI 클라이언트 초기화
            client = openai.OpenAI(api_key=openai_api_key)
            
            # 음성 파일을 텍스트로 변환
            with open(temp_file_path, "rb") as audio_file_obj:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file_obj,
                    language="ko"  # 한국어로 지정
                )
            
            transcribed_text = transcript.text
            
            # Firebase Storage에 오디오 파일 저장 (선택사항)
            try:
                audio_url = await firebase_service.upload_audio_file(
                    content, 
                    audio_file.filename, 
                    user_id
                )
            except Exception as e:
                print(f"오디오 파일 Firebase 저장 실패: {e}")
                audio_url = None
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "text": transcribed_text,
                        "confidence": 0.95,  # Whisper는 confidence를 제공하지 않으므로 고정값
                        "audio_url": audio_url
                    }
                }
            )
            
        finally:
            # 임시 파일 삭제
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except openai.APIError as e:
        raise HTTPException(
            status_code=400,
            detail=f"OpenAI API 오류: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"음성 인식 중 오류가 발생했습니다: {str(e)}"
        )
