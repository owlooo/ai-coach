import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { interviewService } from '../lib/database'
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Eye, 
  Mic,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const History = () => {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState([])
  const [filteredInterviews, setFilteredInterviews] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedInterview, setExpandedInterview] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterviews()
  }, [user])

  const loadInterviews = async () => {
    if (!user) return

    setLoading(true)
    try {
      const result = await interviewService.getInterviewSessions(user.uid)
      if (result.error) {
        console.error('면접 기록 로드 실패:', result.error)
        return
      }

      // Firestore 데이터를 UI에 맞게 변환
      const formattedInterviews = result.data.map(interview => {
        const startTime = interview.startTime ? new Date(interview.startTime) : new Date()
        const endTime = interview.endTime ? new Date(interview.endTime) : new Date()
        const duration = Math.round((endTime - startTime) / 60000) // 분 단위

        return {
          id: interview.id,
          date: startTime.toISOString().split('T')[0],
          time: startTime.toTimeString().slice(0, 5),
          duration: `${duration}분`,
          totalScore: interview.totalScore || 0,
          totalQuestions: interview.totalQuestions || 0,
          category: '개발자', // 기본값
          behaviorData: interview.behaviorData || { awayCount: 0, eyeContactLoss: 0 },
          questions: interview.answers || [],
          feedback: '면접이 완료되었습니다.',
          status: interview.status || 'completed',
          createdAt: interview.createdAt
        }
      })

      setInterviews(formattedInterviews)
      setFilteredInterviews(formattedInterviews)
    } catch (error) {
      console.error('면접 기록 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = interviews.filter(interview => 
      interview.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.date.includes(searchTerm)
    )

    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'score':
          aValue = a.totalScore
          bValue = b.totalScore
          break
        case 'duration':
          aValue = parseInt(a.duration)
          bValue = parseInt(b.duration)
          break
        default:
          aValue = a[sortBy]
          bValue = b[sortBy]
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredInterviews(filtered)
  }, [interviews, searchTerm, sortBy, sortOrder])

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score) => {
    if (score >= 85) return '우수'
    if (score >= 75) return '양호'
    return '개선 필요'
  }

  const downloadInterview = (interview) => {
    const data = {
      ...interview,
      downloadDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `면접기록_${interview.date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleExpanded = (interviewId) => {
    setExpandedInterview(expandedInterview === interviewId ? null : interviewId)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">면접 기록</h1>
        <p className="text-gray-600">
          이전 면접 시뮬레이션 기록을 확인하고 성장을 추적해보세요
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {interviews.length}
          </div>
          <div className="text-sm text-gray-600">총 면접 횟수</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {interviews.length > 0 ? Math.round(interviews.reduce((sum, i) => sum + i.totalScore, 0) / interviews.length) : 0}
          </div>
          <div className="text-sm text-gray-600">평균 점수</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {interviews.length > 0 ? Math.round(interviews.reduce((sum, i) => sum + parseInt(i.duration), 0) / interviews.length) : 0}분
          </div>
          <div className="text-sm text-gray-600">평균 시간</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {interviews.filter(i => i.totalScore >= 85).length}
          </div>
          <div className="text-sm text-gray-600">우수 면접</div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="날짜 또는 카테고리로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="date">날짜</option>
                <option value="score">점수</option>
                <option value="duration">시간</option>
              </select>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="btn-secondary"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 면접 기록 목록 */}
      <div className="space-y-4">
        {filteredInterviews.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">면접 기록이 없습니다</p>
              <p className="text-sm">첫 번째 면접 시뮬레이션을 시작해보세요!</p>
            </div>
          </div>
        ) : (
          filteredInterviews.map((interview) => (
            <div key={interview.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{interview.totalScore}</div>
                    <div className="text-xs text-gray-600">점</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {interview.date} {interview.time}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(interview.totalScore)}`}>
                        {getScoreLabel(interview.totalScore)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{interview.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>{interview.totalQuestions}개 질문</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>시선이탈 {interview.behaviorData.eyeContactLoss}회</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadInterview(interview)}
                    className="btn-secondary text-sm"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    다운로드
                  </button>
                  
                  <button
                    onClick={() => toggleExpanded(interview.id)}
                    className="btn-secondary text-sm"
                  >
                    {expandedInterview === interview.id ? '접기' : '상세보기'}
                  </button>
                </div>
              </div>
              
              {/* 상세 정보 */}
              {expandedInterview === interview.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">전체 피드백</h4>
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{interview.feedback}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">질문별 점수</h4>
                      <div className="space-y-2">
                        {interview.questions.map((q, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700 flex-1 mr-4">{q.question}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(q.score)}`}>
                              {q.score}점
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Eye className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-900">시선 이탈</span>
                        </div>
                        <div className="text-xl font-bold text-orange-600">
                          {interview.behaviorData.eyeContactLoss}회
                        </div>
                      </div>
                      
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Mic className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-gray-900">자리 비움</span>
                        </div>
                        <div className="text-xl font-bold text-red-600">
                          {interview.behaviorData.awayCount}회
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default History
