import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../lib/database'
import { 
  BarChart3, 
  FileText, 
  Mic, 
  TrendingUp, 
  Calendar,
  Target,
  Award,
  BookOpen
} from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    highestScore: 0,
    totalResumes: 0,
    totalQuestions: 0,
    improvementCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      console.log('=== 대시보드 통계 로드 시작 ===')
      console.log('사용자 UID:', user.uid)
      
      const result = await statsService.getUserStats(user.uid)
      console.log('통계 서비스 결과:', result)
      
      if (result.data) {
        console.log('설정할 통계 데이터:', result.data)
        setStats(result.data)
      } else {
        console.log('통계 데이터가 없음')
      }
    } catch (error) {
      console.error('통계 로드 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: '총 면접 횟수',
      value: stats.totalInterviews,
      icon: Mic,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: '최고 점수',
      value: `${stats.highestScore}점`,
      icon: Award,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: '자기소개서',
      value: stats.totalResumes,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: '총 질문 수',
      value: stats.totalQuestions,
      icon: BookOpen,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ]

  const quickActions = [
    {
      title: '자기소개서 분석',
      description: 'PDF 파일을 업로드하여 AI 분석을 받아보세요',
      href: '/resume',
      icon: FileText,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      title: '면접 시뮬레이션',
      description: '실제 면접처럼 질문에 답변하고 평가받으세요',
      href: '/interview',
      icon: Mic,
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: '결과 리포트',
      description: '면접 결과를 상세히 분석해보세요',
      href: '/results',
      icon: BarChart3,
      color: 'from-purple-500 to-violet-600'
    },
    {
      title: '이전 기록',
      description: '과거 면접 기록을 확인하고 성장을 추적하세요',
      href: '/history',
      icon: Calendar,
      color: 'from-orange-500 to-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 환영 메시지 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          안녕하세요! 👋
        </h1>
        <p className="text-lg text-gray-600">
          AI 면접 코치와 함께 면접 실력을 향상시켜보세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={card.title} className="card hover:shadow-medium transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 액션 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">빠른 시작</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <a
              key={action.title}
              href={action.href}
              className="group block p-6 bg-white rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center shadow-medium`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 개선 팁 */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-medium">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">면접 실력 향상 팁</h3>
            <ul className="text-gray-700 space-y-2">
              <li className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary-500" />
                <span>STAR 기법을 활용하여 구체적인 사례를 제시하세요</span>
              </li>
              <li className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary-500" />
                <span>직무와 관련된 경험을 중심으로 답변하세요</span>
              </li>
              <li className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-primary-500" />
                <span>정기적으로 면접 연습을 통해 자신감을 키우세요</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
