import openai
from openai import AsyncOpenAI
from app.utils.config import get_settings

settings = get_settings()

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def analyze_resume(self, resume_text: str) -> str:
        """자기소개서 분석"""
        try:
            # API 키가 없거나 테스트 모드일 때
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
                return self._generate_mock_analysis(resume_text)
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 HR 전문가이자 자기소개서 분석 전문가입니다. 아래의 자기소개서를 분석하고, 사용자에게 구체적이고 실용적인 피드백을 제공합니다. 피드백은 긍정적이고 건설적인 방식으로 작성되어야 하며, 강점과 개선이 필요한 부분을 모두 명확하게 다루어야 합니다.

중요한 지침:
1. 정중하고 자연스러운 말투를 사용하세요 ("이다" 대신 "입니다", "하다" 대신 "합니다")
2. 이모지나 특수 문자 사용을 최소화하고 단순하고 깔끔한 형식을 유지하세요
3. 각 섹션은 간단한 제목과 내용으로 구성하세요

전반적인 평가 (각 항목별 1-10점 + 상세 설명)

목표 설정의 명확성
점수: X/10
분석: 자기소개서에서 제시한 직무 목표나 장기적인 목표가 얼마나 구체적이고 실현 가능한지 평가합니다
강점: 잘 표현된 목표 설정 부분을 구체적으로 언급합니다
개선점: 목표가 추상적이거나 직무와의 연결성이 부족한 부분을 지적하고 개선 방안을 제시합니다

경험과 성과 강조
점수: X/10
분석: 경험을 어떻게 서술하고 있는지, 성과를 얼마나 잘 구체화했는지에 대한 평가입니다
강점: 잘 서술된 경험과 성과 부분을 구체적으로 언급합니다
개선점: 성과를 수치적으로 표현할 수 있는 부분이나 STAR 기법을 더 잘 활용할 수 있는 부분을 제시합니다

문장 구조 및 가독성
점수: X/10
분석: 문장이 지나치게 길거나 복잡한 경우, 이를 어떻게 개선할 수 있는지에 대한 피드백을 제공합니다
강점: 간결하고 명확한 문장 구조를 잘 활용한 부분을 언급합니다
개선점: 복잡하거나 길어서 이해하기 어려운 문장을 구체적으로 지적하고 개선된 예시를 제시합니다

자기소개서의 흐름과 전개
점수: X/10
분석: 자기소개서가 일관되게 흐르고 있는지, 각 문단이 자연스럽게 이어지는지 평가합니다
강점: 논리적이고 자연스러운 흐름을 잘 구성한 부분을 언급합니다
개선점: 문단 간 연결이 부자연스럽거나 정보가 너무 집중된 부분을 지적하고 개선 방안을 제시합니다

직무와의 관련성
점수: X/10
분석: 직무와의 연관성은 얼마나 잘 드러나 있는지, 자기소개서에서 직무와 본인의 경험을 연결하는 방식에 대해 평가합니다
강점: 직무와의 연관성을 잘 드러낸 부분을 구체적으로 언급합니다
개선점: 경험과 직무 연관성을 더 명확히 할 수 있는 부분을 지적하고 개선 방안을 제시합니다

어조와 표현력
점수: X/10
분석: 자기소개서에서 사용하는 어조와 표현이 적절한지 평가합니다
강점: 적절하고 효과적인 어조와 표현을 사용한 부분을 언급합니다
개선점: 너무 격식적이거나 가벼운 어조를 개선할 수 있는 부분을 지적하고 더 자연스러운 표현을 제시합니다

강점과 개선점 종합 피드백
전반적으로 잘 표현된 강점과 개선이 필요한 부분을 종합적으로 정리합니다. 추가적으로 개선할 수 있는 점을 강조합니다.

주요 강점 요약
1. 강점 제목: 구체적인 강점 내용
   - 상세 설명: 왜 이것이 강점인지, 어떤 부분에서 잘 드러나는지 설명합니다
   - 구체적 예시: 자소서에서 해당 부분을 인용하며 설명합니다
   - 효과: 이 강점이 면접관에게 어떤 인상을 줄 수 있는지 설명합니다

2. 강점 제목: 구체적인 강점 내용
   - 상세 설명: 왜 이것이 강점인지, 어떤 부분에서 잘 드러나는지 설명합니다
   - 구체적 예시: 자소서에서 해당 부분을 인용하며 설명합니다
   - 효과: 이 강점이 면접관에게 어떤 인상을 줄 수 있는지 설명합니다

개선이 필요한 부분
1. 개선점 제목: 현재 부족한 부분
   - 현재 상태: 어떤 부분이 부족한지 구체적으로 지적합니다
   - 문제점: 왜 이 부분이 문제인지 설명합니다
   - 구체적 개선 방법: 실제로 어떻게 수정할 수 있는지 구체적인 예시를 제시합니다
   - 개선 후 기대 효과: 개선 후 어떤 효과가 있을지 설명합니다

2. 개선점 제목: 현재 부족한 부분
   - 현재 상태: 어떤 부분이 부족한지 구체적으로 지적합니다
   - 문제점: 왜 이 부분이 문제인지 설명합니다
   - 구체적 개선 방법: 실제로 어떻게 수정할 수 있는지 구체적인 예시를 제시합니다
   - 개선 후 기대 효과: 개선 후 어떤 효과가 있을지 설명합니다

예상 면접 질문과 답변 포인트
자기소개서를 바탕으로 예상되는 면접 질문과 효과적인 답변 방향을 제시합니다

자기소개 및 지원동기 관련
- 구체적인 질문과 효과적인 답변 포인트를 제시합니다

경험 및 성과 관련
- 구체적인 질문과 효과적인 답변 포인트를 제시합니다

역량 및 가치관 관련
- 구체적인 질문과 효과적인 답변 포인트를 제시합니다

최종 권장사항
자기소개서 개선을 위한 우선순위와 구체적인 실행 계획을 제시합니다.

각 항목을 매우 구체적이고 실용적으로 분석해주세요. HR 전문가의 관점에서 긍정적이고 건설적인 피드백을 제공하되, 개선이 필요한 부분은 명확하게 지적해주세요. 자연스럽고 정중한 말투를 유지하세요."""
                    },
                    {
                        "role": "user",
                        "content": f"다음 자기소개서를 분석해주세요:\n\n{resume_text}"
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"AI 분석 중 오류가 발생했습니다: {str(e)}")
    
    def _generate_mock_analysis(self, resume_text: str) -> str:
        """테스트용 모의 분석 결과 생성"""
        text_length = len(resume_text)
        word_count = len(resume_text.split())
        
        return f"""전반적인 평가 (각 항목별 1-10점 + 상세 설명)

목표 설정의 명확성
점수: 7/10
분석: 자기소개서에서 제시한 직무 목표나 장기적인 목표가 얼마나 구체적이고 실현 가능한지 평가합니다
강점: 직무와 관련된 경험을 바탕으로 한 목표 설정이 잘 드러나고 있습니다
개선점: 목표가 다소 추상적입니다. 예를 들어, "이 직무에서 더 많은 기여를 하고 싶다"는 목표보다, "3년의 경험을 바탕으로 해당 분야에서 전문성을 발휘하고 싶다"와 같은 구체적인 목표를 제시하는 것이 좋습니다

경험과 성과 강조
점수: 8/10
분석: 경험을 어떻게 서술하고 있는지, 성과를 얼마나 잘 구체화했는지에 대한 평가입니다
강점: 팀 내에서 중요한 역할을 맡은 점과 협력하며 성과를 달성한 점은 매우 긍정적입니다
개선점: 경험을 수치적으로 제시할 수 있으면 더 좋습니다. 예를 들어, "프로젝트를 통해 20% 성과 향상에 기여했다"와 같은 구체적인 성과를 포함하는 것이 좋습니다

문장 구조 및 가독성
점수: 6/10
분석: 문장이 지나치게 길거나 복잡한 경우, 이를 어떻게 개선할 수 있는지에 대한 피드백을 제공합니다
강점: 전반적으로 문장이 간결하지만, 개선할 여지가 있습니다
개선점: "여러 팀원들과 협력하여 많은 성과를 이루었으며, 이를 통해 팀워크와 문제 해결 능력을 키울 수 있었습니다"는 두 문장으로 나누는 것이 더 읽기 쉬울 것입니다. 예시: "여러 팀원들과 협력하여 많은 성과를 이루었습니다. 이 경험을 통해 팀워크와 문제 해결 능력을 키울 수 있었습니다"

자기소개서의 흐름과 전개
점수: 7/10
분석: 자기소개서가 일관되게 흐르고 있는지, 각 문단이 자연스럽게 이어지는지 평가합니다
강점: 경험이 논리적으로 전개되고 있습니다
개선점: 첫 문단에서 목표만 간단히 언급한 후, 후속 문단에서 경험을 풀어가는 방식이 더 자연스럽습니다. 예를 들어, "저는 해당 직무에 지원한 이유는 관련 경험을 바탕으로 기여하고 싶기 때문입니다"와 같은 간결한 서술을 시작으로, 세부 경험을 풀어가는 방식이 좋습니다

직무와의 관련성
점수: 7/10
분석: 직무와의 연관성은 얼마나 잘 드러나 있는지, 자기소개서에서 직무와 본인의 경험을 연결하는 방식에 대해 평가합니다
강점: 직무에 대한 경험을 잘 언급하고 있습니다
개선점: 경험과 직무 연관성을 좀 더 명확히 하면 좋습니다. 예를 들어, "이 경험이 해당 직무에서 어떻게 도움이 될 수 있는지"를 추가하는 것이 더 효과적입니다

어조와 표현력
점수: 6/10
분석: 자기소개서에서 사용하는 어조와 표현이 적절한지 평가합니다
강점: 어조가 진지하고 전문적입니다
개선점: 어조는 다소 격식적이지만, 조금 더 자연스럽고 자신감 있는 톤을 사용해 보세요. 예를 들어, "저는 항상 새로운 도전을 즐깁니다"라는 표현이 더 자연스러울 수 있습니다

강점과 개선점 종합 피드백
전반적으로 목표와 성과에 대한 표현이 훌륭하며, 특히 경험을 구체적으로 서술한 점이 인상적입니다. 다만, 직무 연관성을 더 강조하고, 문장 구조를 간결하게 만드는 것이 필요합니다.

주요 강점 요약
1. 구체적인 경험 기술: 자소서에서 구체적인 경험과 성과를 잘 드러내고 있습니다
   - 상세 설명: 실제 경험을 바탕으로 한 구체적인 사례가 잘 포함되어 있습니다
   - 구체적 예시: 프로젝트 경험과 성과를 구체적으로 기술했습니다
   - 효과: 면접관에게 신뢰감과 전문성을 어필할 수 있습니다

2. 논리적 구성: 자소서의 전체적인 흐름과 구성이 논리적으로 잘 짜여져 있습니다
   - 상세 설명: 문제상황부터 해결과정, 결과까지의 흐름이 자연스럽습니다
   - 구체적 예시: STAR 기법을 활용한 경험 기술이 잘 되어 있습니다
   - 효과: 체계적인 사고력을 보여줄 수 있습니다

개선이 필요한 부분
1. 수치와 데이터 강화: 더 구체적인 수치와 데이터를 포함하면 좋겠습니다
   - 현재 상태: 일부 성과에 대한 구체적인 수치가 부족합니다
   - 문제점: 정량적 성과가 부족하여 임팩트가 약할 수 있습니다
   - 구체적 개선 방법: "매출 30% 증가", "사용자 만족도 95% 달성" 등 구체적 수치를 추가하시기 바랍니다
   - 개선 후 기대 효과: 더 설득력 있고 임팩트 있는 자소서가 될 것입니다
   - **기대 효과**: 더 설득력 있고 임팩트 있는 자소서가 될 것입니다.

2. **개인적 성장과 배움 강조**: 경험을 통한 개인적 성장과 배움을 더 강조하면 좋겠습니다.
   - **현재 상태**: 결과에 대한 기술은 있지만 개인적 성장 과정이 부족합니다.
   - **문제점**: 단순한 성과 나열에 그칠 수 있습니다.
   - **개선 방법**: 각 경험에서 무엇을 배웠고 어떻게 성장했는지 구체적으로 기술하세요.
   - **기대 효과**: 지원자의 성장 가능성과 학습 능력을 어필할 수 있습니다.

## 📝 예상 면접 질문 (카테고리별 구체적 질문)

### 🎯 자기소개/지원동기
- "자소서에 언급된 경험 중 가장 기억에 남는 것은 무엇인가요?"
- "이 회사를 지원한 구체적인 이유는 무엇인가요?"

### 💼 경험/성과 관련
- "자소서에 나온 프로젝트에서 가장 어려웠던 점과 해결 방법은 무엇인가요?"
- "팀 프로젝트에서 리더십을 발휘한 경험이 있나요?"

### 🧠 역량/가치관 관련  
- "어려운 상황에서 어떻게 문제를 해결하시나요?"
- "개발자로서 추구하는 가치는 무엇인가요?"

---
**📌 참고**: 이 분석은 테스트용 모의 분석입니다. 실제 OpenAI API 키를 설정하면 더 정확하고 상세한 분석을 받을 수 있습니다."""
    
    async def generate_questions(self, resume_analysis: str) -> str:
        """예상 면접 질문 생성"""
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 경험이 풍부한 면접관입니다. 주어진 자기소개서 분석을 바탕으로 다음과 같이 질문을 생성해주세요:

## 🎯 예상 면접 질문

### 📋 기본 질문
- 자기소개 관련 질문 2-3개

### 💼 경험/성과 관련 질문  
- 자소서에 언급된 경험을 바탕으로 한 질문 3-4개

### 🧠 역량/가치관 관련 질문
- 지원자의 역량과 가치관을 파악하는 질문 2-3개

### 🚀 미래/목표 관련 질문
- 지원자의 미래 계획과 목표에 대한 질문 2-3개

각 질문은 구체적이고 실제 면접에서 나올 수 있는 수준으로 작성해주세요."""
                    },
                    {
                        "role": "user",
                        "content": f"자기소개서 분석 결과:\n\n{resume_analysis}\n\n이를 바탕으로 면접 질문을 생성해주세요."
                    }
                ],
                temperature=0.8,
                max_tokens=1500
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"질문 생성 중 오류가 발생했습니다: {str(e)}")
    
    async def evaluate_answer(self, question: str, answer: str) -> dict:
        """면접 답변 평가 (점수와 텍스트 포함)"""
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 면접 평가 전문가입니다. 주어진 질문과 답변을 바탕으로 다음 형식으로 평가하세요:

1. 구체성 (Specificity): 1-10점
2. 직무적합성 (Job Relevance): 1-10점  
3. 논리성 (Logic): 1-10점
4. STAR 기법 활용도 (STAR Method): 1-10점

각 항목에 대해 점수와 함께 구체적인 평가를 제공하세요.

JSON 형식으로 응답하세요:
{
  "scores": {
    "specificity": 8,
    "jobRelevance": 7,
    "logic": 9,
    "starMethod": 6
  },
  "evaluation": "상세한 평가 텍스트"
}"""
                    },
                    {
                        "role": "user",
                        "content": f"질문: {question}\n답변: {answer}\n\n위 답변을 평가해주세요."
                    }
                ],
                temperature=0.5,
                max_tokens=1000
            )
            
            # JSON 파싱 시도
            import json
            try:
                evaluation_text = response.choices[0].message.content
                # JSON 부분만 추출
                start_idx = evaluation_text.find('{')
                end_idx = evaluation_text.rfind('}') + 1
                json_str = evaluation_text[start_idx:end_idx]
                result = json.loads(json_str)
                return result
            except:
                # JSON 파싱 실패 시 기본값 반환
                return {
                    "scores": {
                        "specificity": 7,
                        "jobRelevance": 7,
                        "logic": 7,
                        "starMethod": 7
                    },
                    "evaluation": evaluation_text
                }
            
        except Exception as e:
            raise Exception(f"답변 평가 중 오류가 발생했습니다: {str(e)}")
    
    async def generate_overall_feedback(self, evaluations: list) -> dict:
        """전체 면접 피드백 생성"""
        try:
            # 모든 평가를 하나의 텍스트로 합치기
            all_evaluations = "\n\n".join([
                f"질문: {eval_item['question']}\n답변: {eval_item['answer']}\n평가: {eval_item['evaluation']}"
                for eval_item in evaluations
            ])
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 면접 코치입니다. 주어진 모든 답변 평가를 종합하여 다음 형식으로 피드백을 제공하세요:

강점 (strengths): 구체적인 강점 3-4개를 리스트로
개선사항 (improvements): 각 개선점에 대해 현재 문제상황, 구체적인 개선방법, 기대효과를 포함한 상세한 개선사항 3-4개를 리스트로  
다음단계 (nextSteps): 구체적인 행동 계획 3-4개를 리스트로

JSON 형식으로 응답하세요:
{
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["개선점1", "개선점2", "개선점3"],
  "nextSteps": ["계획1", "계획2", "계획3"]
}"""
                    },
                    {
                        "role": "user",
                        "content": f"다음 면접 평가들을 종합하여 전체 피드백을 생성해주세요:\n\n{all_evaluations}"
                    }
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            # JSON 파싱 시도
            import json
            try:
                feedback_text = response.choices[0].message.content
                # JSON 부분만 추출
                start_idx = feedback_text.find('{')
                end_idx = feedback_text.rfind('}') + 1
                json_str = feedback_text[start_idx:end_idx]
                return json.loads(json_str)
            except:
                # JSON 파싱 실패 시 기본값 반환
                return {
                    "strengths": ["AI 평가를 통해 구체적인 강점을 파악했습니다"],
                    "improvements": ["AI 평가를 통해 개선점을 파악했습니다"],
                    "nextSteps": ["AI 피드백을 바탕으로 면접 실력을 향상시켜보세요"]
                }
            
        except Exception as e:
            print(f"전체 피드백 생성 실패: {e}")
            return {
                "strengths": ["AI 평가를 통해 구체적인 강점을 파악했습니다"],
                "improvements": ["AI 평가를 통해 개선점을 파악했습니다"],
                "nextSteps": ["AI 피드백을 바탕으로 면접 실력을 향상시켜보세요"]
            }

    async def generate_interview_questions(self, resume_content: str, question_count: int = 5) -> list:
        """자기소개서를 바탕으로 면접 질문을 생성합니다."""
        try:
            # API 키가 없거나 테스트 모드일 때
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
                return self._generate_mock_interview_questions(resume_content, question_count)
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 면접관입니다. 주어진 자기소개서를 바탕으로 효과적인 면접 질문을 생성해주세요.

질문 생성 가이드라인:
1. 자기소개서의 내용을 바탕으로 구체적이고 깊이 있는 질문을 만들어주세요
2. 각 질문은 STAR 기법을 활용할 수 있도록 구성해주세요
3. 지원자의 경험과 성과를 더 자세히 알아볼 수 있는 질문을 포함해주세요
4. 직무와의 연관성을 확인할 수 있는 질문도 포함해주세요
5. 질문은 자연스럽고 대화하기 편한 톤으로 작성해주세요

중요한 지침:
- 마크다운 문법(*, **, #, -, 등)을 사용하지 마세요
- 특수 문자나 이모지를 사용하지 마세요
- 순수한 텍스트로만 질문을 작성해주세요
- 각 질문은 한 줄씩 작성해주세요

질문 유형:
- 자기소개/지원동기 관련
- 경험/성과 관련 (STAR 기법 활용)
- 역량/가치관 관련
- 직무 관련성 관련

각 질문을 개별적으로 작성하고, 질문만 반환해주세요."""
                    },
                    {
                        "role": "user",
                        "content": f"다음 자기소개서를 바탕으로 {question_count}개의 면접 질문을 생성해주세요:\n\n{resume_content}"
                    }
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # AI 응답에서 질문들을 추출
            content = response.choices[0].message.content
            questions = [q.strip() for q in content.split('\n') if q.strip() and not q.strip().startswith(('질문', 'Q', 'Question'))]
            
            # 질문이 부족한 경우 기본 질문으로 보완
            if len(questions) < question_count:
                basic_questions = [
                    "자기소개를 해주세요",
                    "지원하신 직무에 대한 동기를 말씀해주세요",
                    "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요",
                    "팀워크를 발휘했던 경험을 말씀해주세요",
                    "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요"
                ]
                questions.extend(basic_questions[len(questions):question_count])
            
            return questions[:question_count]
            
        except Exception as e:
            raise Exception(f"면접 질문 생성 중 오류가 발생했습니다: {str(e)}")

    def _generate_mock_interview_questions(self, resume_content: str, question_count: int) -> list:
        """테스트용 모의 면접 질문 생성"""
        base_questions = [
            "자기소개를 해주세요",
            "지원하신 직무에 대한 동기를 말씀해주세요",
            "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요",
            "팀워크를 발휘했던 경험을 말씀해주세요",
            "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요",
            "본인의 강점과 약점에 대해 말씀해주세요",
            "5년 후 본인의 모습을 어떻게 그리고 계신가요",
            "우리 회사에 왜 지원하셨는지 말씀해주세요"
        ]
        
        # 자기소개서 내용이 있으면 일부 질문을 맞춤형으로 변경
        if resume_content:
            content_length = len(resume_content)
            if content_length > 500:
                base_questions[2] = "자기소개서에 언급하신 프로젝트 경험에 대해 더 자세히 설명해주세요"
            if content_length > 300:
                base_questions[1] = "자기소개서에서 말씀하신 지원 동기를 바탕으로 이 직무에 대한 관심을 설명해주세요"
        
        return base_questions[:question_count]

    async def generate_followup_question(self, original_question: str, answer: str, resume_content: str = "") -> str:
        """답변을 바탕으로 추가 질문을 생성합니다."""
        try:
            # API 키가 없거나 테스트 모드일 때
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
                return self._generate_mock_followup_question(original_question, answer)
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": """당신은 면접관입니다. 지원자의 답변을 듣고 추가 질문을 생성해주세요.

추가 질문 생성 가이드라인:
1. 답변이 구체적이지 않거나 부족한 부분이 있다면 더 자세한 설명을 요청하는 질문을 만들어주세요
2. 답변에서 흥미로운 부분이 있다면 더 깊이 있게 알아보는 질문을 만들어주세요
3. STAR 기법을 더 잘 활용할 수 있도록 하는 질문을 고려해주세요
4. 직무와의 연관성을 더 명확히 할 수 있는 질문을 포함해주세요
5. 질문은 자연스럽고 대화하기 편한 톤으로 작성해주세요

중요한 지침:
- 마크다운 문법(*, **, #, -, 등)을 사용하지 마세요
- 특수 문자나 이모지를 사용하지 마세요
- 순수한 텍스트로만 질문을 작성해주세요
- 질문은 한 줄로 간결하게 작성해주세요

만약 답변이 충분히 구체적이고 만족스럽다면, "추가 질문이 필요하지 않습니다"라고 응답해주세요."""
                    },
                    {
                        "role": "user",
                        "content": f"""원래 질문: {original_question}
지원자 답변: {answer}
{f'자기소개서 내용: {resume_content}' if resume_content else ''}

위 답변을 바탕으로 추가 질문이 필요한지 판단하고, 필요하다면 구체적인 추가 질문을 생성해주세요."""
                    }
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"추가 질문 생성 중 오류가 발생했습니다: {str(e)}")

    def _generate_mock_followup_question(self, original_question: str, answer: str) -> str:
        """테스트용 모의 추가 질문 생성"""
        answer_length = len(answer)
        
        # 답변이 짧으면 더 자세한 설명 요청
        if answer_length < 100:
            return "좀 더 구체적인 예시나 상황을 들어서 설명해주시겠어요"
        
        # 답변이 충분하면 추가 질문 불필요
        if answer_length > 300:
            return "추가 질문이 필요하지 않습니다"
        
        # 중간 길이면 적절한 추가 질문
        followup_questions = [
            "그 경험을 통해 무엇을 배우셨나요",
            "만약 비슷한 상황이 다시 온다면 어떻게 하시겠어요",
            "그 경험에서 가장 어려웠던 부분은 무엇이었나요",
            "팀원들과는 어떻게 협력하셨나요"
        ]
        
        import random
        return random.choice(followup_questions)

# 전역 인스턴스
ai_service = AIService()
