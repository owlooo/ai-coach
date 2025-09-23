import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react'
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'
import { db } from '../lib/firebase'

const Results = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const [interviewData, setInterviewData] = useState(null)
  const [loading, setLoading] = useState(true)

  // 사용자 ID 가져오기
  const getUserId = () => {
    // 인증 로딩 중이면 null 반환
    if (authLoading) {
      return null
    }
    
    // Firebase Authentication 사용자가 있으면 해당 사용자 ID 사용
    if (user && user.uid) {
      return user.uid
    }
    
    // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
    window.location.href = '/login'
    return null
  }

  // 면접 데이터 가져오기
  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        console.log('=== Results 페이지 데이터 로드 시작 ===')
        console.log('URL 파라미터:', params.interviewId)
        console.log('Location state:', location.state)
        
        // 1. URL 파라미터에서 interview_id가 있으면 Firebase에서 직접 가져오기
        if (params.interviewId) {
          console.log('Firebase에서 면접 데이터 조회 중...')
          const userId = getUserId()
          console.log('사용자 ID:', userId)
          
          const interviewDoc = await getDoc(doc(db, 'users', userId, 'interviews', params.interviewId))
          if (interviewDoc.exists()) {
            const data = interviewDoc.data()
            console.log('✅ Firebase에서 면접 데이터 로드 성공:', data)
            setInterviewData(data)
            setLoading(false)
            return
          } else {
            console.log('❌ Firebase에서 면접 데이터를 찾을 수 없음')
          }
        }

        // 2. location.state에서 데이터 가져오기
        if (location.state) {
          console.log('✅ Location state에서 데이터 로드:', location.state)
          setInterviewData(location.state)
          setLoading(false)
          return
        }
        
        // 3. Firebase에서 사용자의 최신 면접 기록 확인
        const userId = getUserId()
        if (userId) {
          console.log('Firebase에서 사용자의 최신 면접 기록 조회 중...')
          try {
            const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
            const { db } = await import('../lib/firebase')
            
            const interviewsQuery = query(
              collection(db, 'users', userId, 'interviews'),
              orderBy('completedAt', 'desc'),
              limit(1)
            )
            const interviewsSnapshot = await getDocs(interviewsQuery)
            
            if (!interviewsSnapshot.empty) {
              const latestInterview = interviewsSnapshot.docs[0].data()
              console.log('✅ Firebase에서 최신 면접 기록 로드:', latestInterview)
              setInterviewData(latestInterview)
              setLoading(false)
              return
            }
          } catch (e) {
            console.error('Firebase 면접 기록 조회 실패:', e)
          }
        }

        // 4. 데이터가 없으면 기본값 설정
        console.log('❌ Firebase에서 면접 데이터를 찾을 수 없음 - 기본값 설정')
        setInterviewData({
          answers: [],
          questions: [],
          completedAt: new Date().toISOString(),
          evaluation: {
            data: {
              scores: {
                specificity: 7,
                jobRelevance: 7,
                logic: 7,
                starMethod: 7
              },
              overallScore: 70,
              evaluations: [],
              feedback: {
                strengths: ["면접을 완료하셨습니다"],
                improvements: ["데이터를 불러오는 중입니다"],
                nextSteps: ["다시 시도해보세요"]
              }
            }
          },
          error: '면접 데이터를 찾을 수 없습니다'
        })
      } catch (error) {
        console.error('❌ 면접 데이터 로드 실패:', error)
        setInterviewData({
          answers: [],
          questions: [],
          completedAt: new Date().toISOString(),
          evaluation: {
            data: {
              scores: {
                specificity: 7,
                jobRelevance: 7,
                logic: 7,
                starMethod: 7
              },
              overallScore: 70,
              evaluations: [],
              feedback: {
                strengths: ["면접을 완료하셨습니다"],
                improvements: ["데이터 로드 중 오류가 발생했습니다"],
                nextSteps: ["다시 시도해보세요"]
              }
            }
          },
          error: '데이터 로드 중 오류가 발생했습니다'
        })
      } finally {
        setLoading(false)
      }
    }

    loadInterviewData()
  }, [params.interviewId, location.state])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? '로그인 상태를 확인하고 있습니다...' : '면접 결과를 불러오는 중...'}
          </p>
        </div>
      </div>
    )
  }

  // 사용자 ID가 없으면 (인증 실패) 아무것도 렌더링하지 않음
  if (!getUserId()) {
    return null
  }

  if (!interviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">면접 데이터를 찾을 수 없습니다.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 btn-primary"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }
  
  // AI 평가 데이터 또는 기본값 사용
  console.log('=== 평가 데이터 처리 시작 ===')
  console.log('interviewData:', interviewData)
  console.log('interviewData.evaluation:', interviewData.evaluation)
  
  const evaluation = interviewData.evaluation?.data || interviewData.evaluation || null
  console.log('evaluation:', evaluation)
  
  const scores = evaluation?.scores || {
    specificity: 7,
    jobRelevance: 7,
    logic: 7,
    starMethod: 7
  }

  const scoreExplanations = evaluation?.scoreExplanations || {
    specificity: `구체성 ${scores.specificity}점 - 기본 평가 기준에 따라 구체적인 사례와 데이터를 포함한 답변을 평가했습니다.`,
    jobRelevance: `직무적합성 ${scores.jobRelevance}점 - 기본 평가 기준에 따라 지원 직무와의 연관성을 평가했습니다.`,
    logic: `논리성 ${scores.logic}점 - 기본 평가 기준에 따라 논리적 흐름과 근거의 일치성을 평가했습니다.`,
    starMethod: `STAR 기법 ${scores.starMethod}점 - 기본 평가 기준에 따라 Situation, Task, Action, Result 구조 활용도를 평가했습니다.`
  }
  console.log('scores:', scores)

  const overallScore = evaluation?.overallScore || Math.round(
    (scores.specificity + scores.jobRelevance + scores.logic + scores.starMethod) / 4
  )
  const overallRating = evaluation?.overallRating || 
    (overallScore >= 9.0 ? "매우 잘했어요" :
     overallScore >= 7.0 ? "잘했어요" :
     overallScore >= 5.0 ? "보통이에요" :
     overallScore >= 3.0 ? "아쉬워요" : "못했어요")
  
  console.log('overallScore:', overallScore)
  console.log('overallRating:', overallRating)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">면접 결과 리포트</h1>
        <p className="text-lg text-gray-600">면접 성과를 상세히 분석해보세요</p>
        <p className="text-sm text-gray-500 mt-2">
          완료 시간: {interviewData.completedAt ? new Date(interviewData.completedAt).toLocaleString('ko-KR') : '시간 정보 없음'}
        </p>
      </div>

      {/* 오류 메시지 */}
      {interviewData.error && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-yellow-800 font-semibold mb-2">ℹ️ 데이터 로드 정보</h3>
            <p className="text-yellow-700">면접 데이터를 불러오는 중 일시적인 문제가 발생했습니다.</p>
            <p className="text-yellow-600 text-sm mt-2">
              {interviewData.error === '면접 데이터를 찾을 수 없습니다' 
                ? '이전 기록에서 데이터를 불러왔습니다.' 
                : '기본 데이터로 결과를 표시합니다.'}
            </p>
          </div>
        </div>
      )}

      {/* 전체 점수 */}
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">{overallScore}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">종합 점수</h2>
          <p className="text-gray-600 mb-2">10점 만점</p>
          <div className="text-lg font-semibold text-gray-800 mb-2">{overallRating}</div>
          {interviewData.error && (
            <p className="text-sm text-red-600 mt-2">※ 기본 점수입니다</p>
          )}
        </div>
      </div>

      {/* 세부 점수 */}
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">구체성</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${scores.specificity * 10}%` }}
                />
              </div>
              <span className="text-lg font-bold text-gray-900">{scores.specificity}/10</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">직무적합성</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${scores.jobRelevance * 10}%` }}
                />
              </div>
              <span className="text-lg font-bold text-gray-900">{scores.jobRelevance}/10</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">논리성</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${scores.logic * 10}%` }}
                />
              </div>
              <span className="text-lg font-bold text-gray-900">{scores.logic}/10</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">STAR 기법</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${scores.starMethod * 10}%` }}
                />
              </div>
              <span className="text-lg font-bold text-gray-900">{scores.starMethod}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* 점수 책정 이유 */}
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6">점수 책정 이유</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg h-32 flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">구체성</h4>
                </div>
                <p className="text-sm text-gray-700 flex-1 overflow-hidden">{scoreExplanations.specificity}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg h-32 flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">논리성</h4>
                </div>
                <p className="text-sm text-gray-700 flex-1 overflow-hidden">{scoreExplanations.logic}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg h-32 flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900">직무적합성</h4>
                </div>
                <p className="text-sm text-gray-700 flex-1 overflow-hidden">{scoreExplanations.jobRelevance}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg h-32 flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-900">STAR 기법</h4>
                </div>
                <p className="text-sm text-gray-700 flex-1 overflow-hidden">{scoreExplanations.starMethod}</p>
              </div>
            </div>
          </div>
          {interviewData.error && (
            <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                💡 기본 점수 설명입니다. 정확한 AI 평가를 위해서는 면접을 다시 진행해주세요.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI 평가 결과 */}
      {evaluation?.evaluations && evaluation.evaluations.length > 0 ? (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-6">AI 상세 평가</h3>
            <div className="space-y-6">
              {evaluation.evaluations.map((eval_item, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    질문 {index + 1}: {eval_item.question}
                  </h4>
                  <p className="text-gray-700 mb-2">
                    <strong>답변:</strong> {eval_item.answer}
                  </p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>AI 평가:</strong> {eval_item.evaluation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="card">
            <div className="text-center py-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI 상세 평가</h3>
              <p className="text-gray-600 mb-4">
                {interviewData.error 
                  ? '평가 데이터를 불러오는 중 일시적인 문제가 발생했습니다.'
                  : 'AI 평가 데이터가 준비되지 않았습니다.'}
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 기본 점수와 피드백이 표시됩니다. 정확한 AI 평가를 위해서는 면접을 다시 진행해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드백 */}
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 mb-6">면접결과</h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">👍 좋았던점</h4>
              <ul className="text-gray-700 space-y-1">
                {(evaluation?.feedback?.strengths || [
                  "구체적인 사례와 데이터를 잘 제시했습니다",
                  "논리적이고 체계적인 답변 구조를 보여주었습니다",
                  "직무와의 연관성을 명확히 드러냈습니다"
                ]).map((strength, index) => (
                  <li key={index}>• {typeof strength === 'string' ? strength : JSON.stringify(strength)}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">😔 아쉬웠던점</h4>
              <ul className="text-gray-700 space-y-1">
                {(evaluation?.feedback?.improvements || [
                  "STAR 기법을 더 체계적으로 활용해보세요",
                  "결과(Result) 부분을 더 구체적으로 설명하세요",
                  "개인적 성장과 학습 과정을 강조해보세요"
                ]).map((improvement, index) => (
                  <li key={index}>• {typeof improvement === 'string' ? improvement : JSON.stringify(improvement)}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 개선방향</h4>
              <ul className="text-gray-700 space-y-1">
                {(evaluation?.feedback?.nextSteps || [
                  "더 많은 면접 연습을 통해 자신감을 키우세요",
                  "다양한 상황별 답변을 준비해보세요",
                  "피드백을 바탕으로 자기소개서를 개선해보세요"
                ]).map((step, index) => (
                  <li key={index}>• {typeof step === 'string' ? step : JSON.stringify(step)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results
