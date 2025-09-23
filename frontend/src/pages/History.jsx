import React, { useState, useEffect } from 'react'
import { Calendar, Clock, BarChart3, Download, Eye } from 'lucide-react'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

const History = () => {
  const { user, loading: authLoading } = useAuth()
  const [selectedTab, setSelectedTab] = useState('interviews')
  const [interviews, setInterviews] = useState([])
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)

  // Firebase Auth 사용자 ID 가져오기
  const getUserId = () => {
    if (!user || !user.uid) {
      // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
      window.location.href = '/login'
      return null
    }
    return user.uid
  }

  // Firebase에서 데이터 로드 (사용자 인증 상태 변경 시)
  useEffect(() => {
    // 인증 로딩이 완료된 후에만 처리
    if (!authLoading) {
      if (user && user.uid) {
        loadHistoryData()
      } else {
        // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
        console.log('로그인하지 않은 사용자 - 로그인 페이지로 리다이렉트')
        window.location.href = '/login'
      }
    }
  }, [user, authLoading])

  const loadHistoryData = async () => {
    try {
      const userId = getUserId()
      
      // Firebase에서 사용자별 면접 기록 로드
      const interviewsQuery = query(
        collection(db, 'users', userId, 'interviews'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const interviewsSnapshot = await getDocs(interviewsQuery)
      const interviewsData = interviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setInterviews(interviewsData)

      // Firebase에서 사용자별 자기소개서 분석 기록 로드
      const resumesQuery = query(
        collection(db, 'users', userId, 'resumes'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const resumesSnapshot = await getDocs(resumesQuery)
      const resumesData = resumesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setResumes(resumesData)
    } catch (error) {
      console.error('Firebase 데이터 로드 실패:', error)
      setInterviews([])
      setResumes([])
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'interviews', name: '면접 기록', count: interviews.length },
    { id: 'resumes', name: '자소서 분석', count: resumes.length }
  ]

  // 로그인하지 않은 사용자 처리
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Eye className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h3>
          <p className="text-gray-600 text-lg mb-6">
            이전 기록을 보려면 먼저 로그인해주세요.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  // 인증 로딩 중이거나 데이터 로딩 중일 때
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {authLoading ? '로그인 상태를 확인하고 있습니다' : '기록을 불러오고 있습니다'}
          </h3>
          <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">이전 기록</h1>
        <p className="text-lg text-gray-600">과거 면접 기록을 확인하고 성장을 추적하세요</p>
      </div>

      {/* 탭 */}
      <div className="max-w-4xl mx-auto">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 면접 기록 */}
      {selectedTab === 'interviews' && (
        <div className="max-w-4xl mx-auto">
          {interviews.length > 0 ? (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {interview.isResumeBased ? '자기소개서 기반 면접' : '기본 면접'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(interview.completedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">점수</p>
                        <p className="text-lg font-bold text-gray-900">
                          {interview.overallScore || interview.score || 'N/A'}점
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">질문</p>
                        <p className="text-lg font-bold text-gray-900">
                          {interview.questions?.length || interview.answers?.length || 0}개
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">답변</p>
                        <p className="text-lg font-bold text-gray-900">
                          {interview.answers?.length || 0}개
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="btn-secondary flex items-center"
                        onClick={() => {
                          // Firebase ID가 있으면 직접 링크, 없으면 localStorage 사용
                          if (interview.id) {
                            // 같은 탭에서 열기 (인증 상태 유지)
                            window.location.href = `/results/${interview.id}`
                          } else {
                            // 면접 결과 상세 보기
                            const resultData = {
                              answers: interview.answers,
                              questions: interview.questions,
                              completedAt: interview.completedAt,
                              evaluation: interview.evaluation,
                              isResumeBased: interview.isResumeBased
                            }
                            localStorage.setItem('tempInterviewResult', JSON.stringify(resultData))
                            window.location.href = '/results'
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        보기
                      </button>
                      <button 
                        className="btn-secondary flex items-center"
                        onClick={() => {
                          // 면접 결과 다운로드
                          const resultData = {
                            answers: interview.answers,
                            questions: interview.questions,
                            completedAt: interview.completedAt,
                            evaluation: interview.evaluation,
                            isResumeBased: interview.isResumeBased
                          }
                          const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `면접결과_${new Date(interview.completedAt).toISOString().split('T')[0]}.json`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">면접 기록이 없습니다</h3>
              <p className="text-gray-600 mb-4">아직 완료된 면접이 없습니다.</p>
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/interview'}
              >
                면접 시작하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 자소서 분석 기록 */}
      {selectedTab === 'resumes' && (
        <div className="max-w-4xl mx-auto">
          {resumes.length > 0 ? (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{resume.fileName}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(resume.analyzedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">분석 완료</p>
                        <p className="text-lg font-bold text-gray-900">완료</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">파일 크기</p>
                        <p className="text-lg font-bold text-gray-900">
                          {resume.fileSize ? (resume.fileSize / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="btn-secondary flex items-center"
                        onClick={() => {
                          // Firebase ID가 있으면 직접 링크, 없으면 localStorage 사용
                          if (resume.id) {
                            // 같은 탭에서 열기 (인증 상태 유지)
                            window.location.href = `/resume-report/${resume.id}`
                          } else {
                            // 자기소개서 분석 결과 보기
                            const analysisData = {
                              analysis: resume.analysis,
                              fileInfo: resume.fileInfo
                            }
                            localStorage.setItem('tempResumeAnalysis', JSON.stringify(analysisData))
                            window.location.href = '/resume-report'
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        보기
                      </button>
                      <button 
                        className="btn-secondary flex items-center"
                        onClick={() => {
                          // 분석 결과 다운로드
                          const analysisData = {
                            fileName: resume.fileName,
                            analyzedAt: resume.analyzedAt,
                            analysis: resume.analysis,
                            fileInfo: resume.fileInfo
                          }
                          const blob = new Blob([JSON.stringify(analysisData, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `자기소개서분석_${resume.fileName}_${new Date(resume.analyzedAt).toISOString().split('T')[0]}.json`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">자기소개서 분석 기록이 없습니다</h3>
              <p className="text-gray-600 mb-4">아직 분석된 자기소개서가 없습니다.</p>
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/resume'}
              >
                자기소개서 분석하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 통계 요약 */}
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">성장 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{interviews.length}</p>
              <p className="text-sm text-gray-500">총 면접 횟수</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{resumes.length}</p>
              <p className="text-sm text-gray-500">자소서 분석 횟수</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.reduce((acc, curr) => acc + (curr.questions?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">총 질문 수</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Download className="w-6 h-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {interviews.reduce((acc, curr) => acc + (curr.answers?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">총 답변 수</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default History
