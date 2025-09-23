import React, { useEffect, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Home, 
  FileText, 
  Mic, 
  BarChart3, 
  History, 
  LogOut,
  User
} from 'lucide-react'

const Layout = ({ children }) => {
  const { user, loading: authLoading, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  // 사용자 정보 확인 (디버깅용)
  useEffect(() => {
    console.log('Layout - 사용자 정보:', { user, email: user?.email, uid: user?.uid, authLoading })
  }, [user, authLoading])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navigation = [
    { name: '대시보드', href: '/', icon: Home },
    { name: '자기소개서', href: '/resume', icon: FileText },
    { name: '면접 시뮬레이션', href: '/interview', icon: Mic },
    { name: '결과 리포트', href: '/results', icon: BarChart3 },
    { name: '이전 기록', href: '/history', icon: History },
  ]

  // 사용자가 로그인하지 않았으면 로그인 페이지로 리다이렉트 (인증 로딩 완료 후에만)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  // 인증 로딩 중이거나 사용자가 없으면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">로그인 상태를 확인하고 있습니다</h3>
          <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 사이드바 */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-md shadow-large border-r border-white/20">
        <div className="flex h-full flex-col">
          {/* 로고 */}
          <div className="flex h-20 items-center justify-center border-b border-gray-200/50 bg-gradient-to-r from-primary-50 to-accent-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-medium">
                <span className="text-white text-lg">🎯</span>
              </div>
              <h1 className="text-xl font-bold gradient-text">AI 면접 코치</h1>
            </div>
          </div>

          {/* 네비게이션 */}
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-medium'
                      : 'text-gray-700 hover:bg-white/50 hover:text-gray-900 hover:shadow-soft'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="border-t border-gray-200/50 p-6 bg-gradient-to-r from-gray-50 to-gray-100/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-accent-500 shadow-medium">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.email || user?.displayName || '익명 사용자'}
                </p>
                <p className="text-xs text-gray-500">
                  {user ? '온라인' : '오프라인'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl hover:bg-white/50 hover:shadow-soft transition-all duration-300 transform hover:scale-105"
            >
              <LogOut className="mr-3 h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="pl-64">
        <main className="py-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
