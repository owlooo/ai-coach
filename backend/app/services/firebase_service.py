import firebase_admin
from firebase_admin import credentials, firestore, storage
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

class FirebaseService:
    def __init__(self):
        # Firebase 초기화
        if not firebase_admin._apps:
            try:
                # 환경변수에서 서비스 계정 키 경로 가져오기
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                
                # 환경변수가 없으면 기본 경로 시도
                if not service_account_path:
                    service_account_path = 'firebase-service-account.json'
                
                # 상대 경로를 절대 경로로 변환
                if not os.path.isabs(service_account_path):
                    service_account_path = os.path.join(os.getcwd(), service_account_path)
                
                print(f"서비스 계정 파일 경로: {service_account_path}")
                print(f"파일 존재 여부: {os.path.exists(service_account_path)}")
                
                if os.path.exists(service_account_path):
                    print("서비스 계정 파일로 인증 시도...")
                    cred = credentials.Certificate(service_account_path)
                else:
                    print("서비스 계정 파일을 찾을 수 없음 - 기본 인증 사용...")
                    # 기본 서비스 계정 사용 (Firebase Functions 환경 또는 로컬 개발)
                    cred = credentials.ApplicationDefault()
                
                firebase_admin.initialize_app(cred, {
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'vive-coding-3bd24.firebasestorage.app')
                })
                
                self.db = firestore.client()
                self.bucket = storage.bucket()
                print("Firebase 초기화 성공")
            except Exception as e:
                print(f"Firebase 초기화 실패: {e}")
                self.db = None
                self.bucket = None
    
    async def save_interview_record(self, interview_data: Dict, user_id: str = "anonymous") -> str:
        """면접 기록을 Firestore에 저장 (사용자별 분리)"""
        if not self.db:
            print("Firebase DB가 초기화되지 않았습니다.")
            return None
        try:
            doc_ref = self.db.collection('users').document(user_id).collection('interviews').document()
            interview_data['id'] = doc_ref.id
            interview_data['userId'] = user_id
            interview_data['createdAt'] = datetime.now()
            doc_ref.set(interview_data)
            
            # 통계 업데이트
            await self.update_interview_stats(user_id, interview_data)
            
            return doc_ref.id
        except Exception as e:
            print(f"면접 기록 저장 실패: {e}")
            raise e
    
    async def update_interview_stats(self, user_id: str, interview_data: Dict):
        """면접 통계 업데이트"""
        if not self.db:
            print("Firebase DB가 초기화되지 않았습니다.")
            return
        
        try:
            # 현재 사용자 통계 가져오기
            user_doc_ref = self.db.collection('users').document(user_id)
            user_doc = user_doc_ref.get()
            
            current_stats = {
                'totalInterviews': 0,
                'averageScore': 0,
                'totalQuestions': 0,
                'totalResumes': 0,
                'improvementCount': 0
            }
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                current_stats.update({
                    'totalInterviews': user_data.get('totalInterviews', 0),
                    'averageScore': user_data.get('averageScore', 0),
                    'totalQuestions': user_data.get('totalQuestions', 0),
                    'totalResumes': user_data.get('totalResumes', 0),
                    'improvementCount': user_data.get('improvementCount', 0)
                })
            
            # 새로운 통계 계산
            total_interviews = current_stats['totalInterviews'] + 1
            current_score = interview_data.get('totalScore', 0)
            
            # 평균 점수 계산
            if total_interviews == 1:
                average_score = current_score
            else:
                total_score_sum = (current_stats['averageScore'] * current_stats['totalInterviews']) + current_score
                average_score = round(total_score_sum / total_interviews)
            
            # 총 질문 수 업데이트
            total_questions = current_stats['totalQuestions'] + interview_data.get('totalQuestions', 0)
            
            # 통계 업데이트
            new_stats = {
                'totalInterviews': total_interviews,
                'averageScore': average_score,
                'totalQuestions': total_questions,
                'totalResumes': current_stats['totalResumes'],  # 자기소개서 수는 별도 업데이트
                'improvementCount': current_stats['improvementCount'],
                'updatedAt': datetime.now()
            }
            
            user_doc_ref.set(new_stats, merge=True)
            print(f"사용자 {user_id} 통계 업데이트 완료: 면접 {total_interviews}회, 평균 {average_score}점")
            
        except Exception as e:
            print(f"통계 업데이트 실패: {e}")
    
    async def update_resume_stats(self, user_id: str):
        """자기소개서 통계 업데이트"""
        if not self.db:
            print("Firebase DB가 초기화되지 않았습니다.")
            return
        
        try:
            # 현재 사용자 통계 가져오기
            user_doc_ref = self.db.collection('users').document(user_id)
            user_doc = user_doc_ref.get()
            
            current_stats = {
                'totalInterviews': 0,
                'averageScore': 0,
                'totalQuestions': 0,
                'totalResumes': 0,
                'improvementCount': 0
            }
            
            if user_doc.exists:
                user_data = user_doc.to_dict()
                current_stats.update({
                    'totalInterviews': user_data.get('totalInterviews', 0),
                    'averageScore': user_data.get('averageScore', 0),
                    'totalQuestions': user_data.get('totalQuestions', 0),
                    'totalResumes': user_data.get('totalResumes', 0),
                    'improvementCount': user_data.get('improvementCount', 0)
                })
            
            # 자기소개서 수 증가
            total_resumes = current_stats['totalResumes'] + 1
            
            # 통계 업데이트
            new_stats = {
                'totalInterviews': current_stats['totalInterviews'],
                'averageScore': current_stats['averageScore'],
                'totalQuestions': current_stats['totalQuestions'],
                'totalResumes': total_resumes,
                'improvementCount': current_stats['improvementCount'],
                'updatedAt': datetime.now()
            }
            
            user_doc_ref.set(new_stats, merge=True)
            print(f"사용자 {user_id} 자기소개서 통계 업데이트 완료: 총 {total_resumes}개")
            
        except Exception as e:
            print(f"자기소개서 통계 업데이트 실패: {e}")
    
    async def save_resume_analysis(self, resume_data: Dict, user_id: str = "anonymous") -> str:
        """자기소개서 분석 결과를 Firestore에 저장 (사용자별 분리)"""
        if not self.db:
            print("Firebase DB가 초기화되지 않았습니다.")
            return None
        try:
            doc_ref = self.db.collection('users').document(user_id).collection('resumes').document()
            resume_data['id'] = doc_ref.id
            resume_data['userId'] = user_id
            resume_data['createdAt'] = datetime.now()
            doc_ref.set(resume_data)
            
            # 자기소개서 통계 업데이트
            await self.update_resume_stats(user_id)
            
            return doc_ref.id
        except Exception as e:
            print(f"자기소개서 분석 저장 실패: {e}")
            raise e
    
    async def upload_resume_file(self, file_content: bytes, file_name: str, user_id: str = "anonymous") -> str:
        """자기소개서 PDF 파일을 Firebase Storage에 업로드 (사용자별 분리)"""
        if not self.bucket:
            print("Firebase Storage가 초기화되지 않았습니다.")
            return None
        try:
            file_id = str(uuid.uuid4())
            blob_name = f"users/{user_id}/resumes/{file_id}_{file_name}"
            blob = self.bucket.blob(blob_name)
            
            blob.upload_from_string(file_content, content_type='application/pdf')
            
            # 공개 URL 생성
            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"파일 업로드 실패: {e}")
            raise e
    
    async def upload_audio_file(self, audio_content: bytes, file_name: str, user_id: str = "anonymous") -> str:
        """면접 녹음 파일을 Firebase Storage에 업로드 (사용자별 분리)"""
        try:
            file_id = str(uuid.uuid4())
            blob_name = f"users/{user_id}/interviews/audio/{file_id}_{file_name}"
            blob = self.bucket.blob(blob_name)
            
            blob.upload_from_string(audio_content, content_type='audio/wav')
            
            # 공개 URL 생성
            blob.make_public()
            return blob.public_url
        except Exception as e:
            print(f"오디오 업로드 실패: {e}")
            raise e
    
    async def get_interview_history(self, user_id: str = "anonymous", limit: int = 50) -> List[Dict]:
        """면접 기록 목록 조회 (사용자별)"""
        try:
            docs = self.db.collection('users').document(user_id).collection('interviews').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"면접 기록 조회 실패: {e}")
            return []
    
    async def get_resume_history(self, user_id: str = "anonymous", limit: int = 50) -> List[Dict]:
        """자기소개서 분석 기록 목록 조회 (사용자별)"""
        try:
            docs = self.db.collection('users').document(user_id).collection('resumes').order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            print(f"자기소개서 기록 조회 실패: {e}")
            return []
    
    async def get_interview_by_id(self, interview_id: str, user_id: str = "anonymous") -> Optional[Dict]:
        """특정 면접 기록 조회 (사용자별)"""
        try:
            doc = self.db.collection('users').document(user_id).collection('interviews').document(interview_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"면접 기록 조회 실패: {e}")
            return None
    
    async def get_resume_by_id(self, resume_id: str, user_id: str = "anonymous") -> Optional[Dict]:
        """특정 자기소개서 분석 기록 조회 (사용자별)"""
        try:
            doc = self.db.collection('users').document(user_id).collection('resumes').document(resume_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            print(f"자기소개서 기록 조회 실패: {e}")
            return None

# 전역 인스턴스
firebase_service = FirebaseService()
