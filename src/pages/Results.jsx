import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Share2,
  Calendar,
  Clock,
  Target,
  Eye,
  Mic
} from 'lucide-react'

const Results = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [interviewData, setInterviewData] = useState([])
  const [behaviorData, setBehaviorData] = useState({})
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    if (location.state) {
      setInterviewData(location.state.interviewData || [])
      setBehaviorData(location.state.behaviorData || {})
      setTotalQuestions(location.state.totalQuestions || 0)
      
      // 전체 점수 계산
      const avgScore = location.state.interviewData?.length > 0 
        ? location.state.interviewData.reduce((sum, item) => sum + item.score, 0) / location.state.interviewData.length
        : 0
      setOverallScore(Math.round(avgScore))
    } else {
      // 테스트용 데이터
      const mockData = [
        {
          question: "React와 Node.js를 사용한 프로젝트에서 가장 어려웠던 점은 무엇이었나요?",
          category: "직무",
          difficulty: "medium",
          score: 82,
          evaluation: { specificity: 85, jobFit: 90, logic: 80, star: 75 },
          feedback: "구체적인 기술과 학습 과정이 잘 드러났습니다."
        },
        {
          question: "삼성전자 인턴십에서 배운 가장 중요한 것은 무엇인가요?",
          category: "경험",
          difficulty: "easy",
          score: 88,
          evaluation: { specificity: 90, jobFit: 85, logic: 90, star: 85 },
          feedback: "명확한 경험과 성과가 잘 표현되었습니다."
        },
        {
          question: "개발자로서 추구하는 가치는 무엇인가요?",
          category: "가치관",
          difficulty: "medium",
          score: 75,
          evaluation: { specificity: 70, jobFit: 80, logic: 75, star: 70 },
          feedback: "가치관이 명확하지만 구체적인 사례가 부족합니다."
        },
        {
          question: "프로젝트 마감일이 다가왔는데 예상보다 많은 버그가 발견되었다면 어떻게 대처하시겠나요?",
          category: "압박",
          difficulty: "hard",
          score: 78,
          evaluation: { specificity: 80, jobFit: 75, logic: 85, star: 70 },
          feedback: "문제 해결 과정이 체계적이지만 우선순위 설정이 부족합니다."
        }
      ]
      
      setInterviewData(mockData)
      setBehaviorData({ awayCount: 3, eyeContactLoss: 7 })
      setTotalQuestions(4)
      setOverallScore(81)
    }
  }, [location.state])

  const categoryData = interviewData.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, count: 0 }
    }
    acc[item.category].total += item.score
    acc[item.category].count += 1
    return acc
  }, {})

  const categoryChartData = Object.entries(categoryData).map(([category, data]) => ({
    category,
    score: Math.round(data.total / data.count)
  }))

  const evaluationData = [
    { name: '구체성', value: Math.round(interviewData.reduce((sum, item) => sum + item.evaluation.specificity, 0) / interviewData.length) },
    { name: '직무적합성', value: Math.round(interviewData.reduce((sum, item) => sum + item.evaluation.jobFit, 0) / interviewData.length) },
    { name: '논리성', value: Math.round(interviewData.reduce((sum, item) => sum + item.evaluation.logic, 0) / interviewData.length) },
    { name: 'STAR 기법', value: Math.round(interviewData.reduce((sum, item) => sum + item.evaluation.star, 0) / interviewData.length) }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  const downloadReport = () => {
    const reportData = {
      date: new Date().toLocaleDateString('ko-KR'),
      overallScore,
      totalQuestions,
      behaviorData,
      interviewData
    }
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `면접결과_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return '우수'
    if (score >= 70) return '양호'
    return '개선 필요'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">면접 결과 리포트</h1>
          <p className="text-gray-600">
            면접 시뮬레이션 결과를 종합적으로 분석해드립니다
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={downloadReport}
            className="btn-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            리포트 다운로드
          </button>
          <button
            onClick={() => navigate('/interview')}
            className="btn-primary"
          >
            다시 면접하기
          </button>
        </div>
      </div>

      {/* 전체 점수 및 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-4xl font-bold text-primary-600 mb-2">{overallScore}</div>
          <div className="text-sm text-gray-600 mb-1">전체 점수</div>
          <div className={`text-sm font-medium ${getScoreColor(overallScore)}`}>
            {getScoreLabel(overallScore)}
          </div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{totalQuestions}</div>
          <div className="text-sm text-gray-600 mb-1">총 질문 수</div>
          <div className="text-sm font-medium text-gray-700">완료</div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            {Math.round(behaviorData.awayCount || 0)}
          </div>
          <div className="text-sm text-gray-600 mb-1">자리 비움</div>
          <div className="text-sm font-medium text-gray-700">회</div>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl font-bold text-red-600 mb-2">
            {Math.round(behaviorData.eyeContactLoss || 0)}
          </div>
          <div className="text-sm text-gray-600 mb-1">시선 이탈</div>
          <div className="text-sm font-medium text-gray-700">회</div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 카테고리별 점수 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">카테고리별 평균 점수</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 평가 항목별 점수 */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">평가 항목별 점수</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={evaluationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}점`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {evaluationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 상세 피드백 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">질문별 상세 피드백</h3>
        <div className="space-y-6">
          {interviewData.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {item.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.difficulty === 'easy' ? '쉬움' : 
                       item.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">{item.question}</h4>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}점
                  </div>
                  <div className="text-sm text-gray-600">{getScoreLabel(item.score)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{item.evaluation.specificity}</div>
                  <div className="text-xs text-gray-600">구체성</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{item.evaluation.jobFit}</div>
                  <div className="text-xs text-gray-600">직무적합성</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">{item.evaluation.logic}</div>
                  <div className="text-xs text-gray-600">논리성</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">{item.evaluation.star}</div>
                  <div className="text-xs text-gray-600">STAR 기법</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900 mb-1">피드백</div>
                    <div className="text-gray-700">{item.feedback}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 행동 분석 결과 */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">행동 분석 결과</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h4 className="font-semibold text-gray-900">자리 비움</h4>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Math.round(behaviorData.awayCount || 0)}회
            </div>
            <p className="text-sm text-gray-600">
              면접 중 자리를 비운 횟수입니다. 최소화하는 것이 좋습니다.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Eye className="h-6 w-6 text-red-600" />
              <h4 className="font-semibold text-gray-900">시선 이탈</h4>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {Math.round(behaviorData.eyeContactLoss || 0)}회
            </div>
            <p className="text-sm text-gray-600">
              면접관과의 시선 접촉을 잃은 횟수입니다. 적절한 아이컨택을 유지하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 개선 권장사항 */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">개선 권장사항</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">STAR 기법 활용 강화</div>
              <div className="text-sm text-gray-600">상황(Situation), 과제(Task), 행동(Action), 결과(Result) 순서로 답변하세요.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">구체적인 사례 제시</div>
              <div className="text-sm text-gray-600">추상적인 설명보다는 구체적인 숫자와 사례를 포함하세요.</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">시선 접촉 개선</div>
              <div className="text-sm text-gray-600">면접관과의 자연스러운 아이컨택을 유지하세요.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Results

