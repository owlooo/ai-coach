import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { statsService } from '../lib/database'
import { 
  FileText, 
  Mic, 
  BarChart3, 
  History, 
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Loader,
  RefreshCw
} from 'lucide-react'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalResumes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    } else if (user) {
      loadStats()
    }
  }, [user, authLoading, navigate])

  const loadStats = async () => {
    if (!user || !user.uid) {
      setLoading(false)
      return
    }

    try {
      const result = await statsService.getUserStats(user.uid)
      if (result.error) {
        console.error('통계 로드 실패:', result.error)
        return
      }

      setStats({
        totalInterviews: result.data.totalInterviews || 0,
        averageScore: result.data.averageScore || 0,
        totalResumes: result.data.totalResumes || 0
      })
    } catch (error) {
      console.error('통계 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      title: '자기소개서 분석',
      description: 'PDF 업로드로 자소서 내용을 분석하고 피드백을 받아보세요',
      icon: FileText,
      href: '/resume',
      color: 'bg-blue-500'
    },
    {
      title: '면접 시뮬레이션',
      description: 'AI가 생성한 질문으로 실제 면접처럼 연습해보세요',
      icon: Mic,
      href: '/interview',
      color: 'bg-green-500'
    },
    {
      title: '결과 리포트',
      description: '면접 결과를 상세히 분석하고 개선점을 확인하세요',
      icon: BarChart3,
      href: '/results',
      color: 'bg-purple-500'
    },
    {
      title: '이전 기록',
      description: '과거 면접 연습 기록을 확인하고 성장을 추적하세요',
      icon: History,
      href: '/history',
      color: 'bg-orange-500'
    }
  ]

  const statsCards = [
    { 
      label: '완료된 면접', 
      value: loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.totalInterviews.toString(), 
      icon: CheckCircle, 
      color: 'text-green-600' 
    },
    { 
      label: '평균 점수', 
      value: loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.averageScore.toString(), 
      icon: Target, 
      color: 'text-blue-600' 
    },
    { 
      label: '분석된 자소서', 
      value: loading ? <Loader className="h-6 w-6 animate-spin" /> : stats.totalResumes.toString(), 
      icon: FileText, 
      color: 'text-purple-600' 
    }
  ]

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 헤더 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-accent-600 rounded-3xl p-8 text-white shadow-large">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/90 to-accent-600/90"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center floating">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">안녕하세요! 👋</h1>
              <p className="text-white/90 text-lg font-medium">
                AI 면접 코치와 함께 완벽한 면접을 준비해보세요
              </p>
            </div>
          </div>
        </div>
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ${stat.color} shadow-medium`}>
                <stat.icon className="h-7 w-7" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 기능 카드 */}
      <div className="animate-slide-up">
        <h2 className="text-3xl font-bold gradient-text mb-8 text-center">주요 기능</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.href}
              className="card group animate-slide-up"
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div className="flex items-start space-x-6">
                <div className={`p-4 rounded-2xl ${feature.color} text-white shadow-medium group-hover:shadow-large transition-all duration-300`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors duration-200">
                    시작하기
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="card-glass animate-slide-up bg-gradient-to-r from-success-50 via-primary-50 to-accent-50 border-success-200">
        <h3 className="text-2xl font-bold gradient-text mb-6 text-center">
          🚀 빠른 시작 가이드
        </h3>
        <div className="space-y-4">
          {[
            "자기소개서 PDF를 업로드하고 분석받기",
            "AI가 생성한 예상 질문으로 면접 연습하기", 
            "상세한 피드백과 개선점 확인하기"
          ].map((step, index) => (
            <div key={index} className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: `${(index + 6) * 100}ms` }}>
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-medium">
                {index + 1}
              </div>
              <span className="text-gray-700 font-medium text-lg">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
