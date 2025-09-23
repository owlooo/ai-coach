import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Target,
  Brain,
  Briefcase,
  Lightbulb,
  Wrench,
  FileCheck
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const ResumeReport = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const [currentPage, setCurrentPage] = useState(0)
  const [analysisData, setAnalysisData] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  // 사용자 ID 가져오기
  const getUserId = () => {
    return localStorage.getItem('userId') || 'anonymous'
  }

  useEffect(() => {
    const loadResumeData = async () => {
      try {
        // 1. URL 파라미터에서 resume_id가 있으면 Firebase에서 직접 가져오기
        if (params.resumeId) {
          const userId = getUserId()
          const resumeDoc = await getDoc(doc(db, 'users', userId, 'resumes', params.resumeId))
          if (resumeDoc.exists()) {
            const resumeData = resumeDoc.data()
            setAnalysisData(resumeData.analysis)
            setFileInfo(resumeData.fileInfo)
            setLoading(false)
            return
          }
        }

        // 2. location.state에서 데이터 가져오기
        if (location.state?.analysis && location.state?.fileInfo) {
          setAnalysisData(location.state.analysis)
          setFileInfo(location.state.fileInfo)
          setLoading(false)
          return
        }

        // 3. localStorage에서 임시 데이터 확인
        const tempData = localStorage.getItem('tempResumeAnalysis')
        if (tempData) {
          const parsedData = JSON.parse(tempData)
          setAnalysisData(parsedData.analysis)
          setFileInfo(parsedData.fileInfo)
          localStorage.removeItem('tempResumeAnalysis') // 사용 후 삭제
          setLoading(false)
          return
        }

        // 4. 데이터가 없으면 메인 페이지로 리다이렉트
        navigate('/resume')
      } catch (error) {
        console.error('분석 데이터 로드 실패:', error)
        navigate('/resume')
      } finally {
        setLoading(false)
      }
    }

    loadResumeData()
  }, [params.resumeId, location.state, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const pages = [
    {
      id: 'overview',
      title: '분석 개요',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'blue'
    },
    {
      id: 'goals',
      title: '목표 설정의 명확성',
      icon: <Target className="w-6 h-6" />,
      color: 'green'
    },
    {
      id: 'experience',
      title: '경험과 성과 강조',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'orange'
    },
    {
      id: 'readability',
      title: '문장 구조 및 가독성',
      icon: <Brain className="w-6 h-6" />,
      color: 'purple'
    },
    {
      id: 'flow',
      title: '흐름과 전개',
      icon: <FileText className="w-6 h-6" />,
      color: 'indigo'
    },
    {
      id: 'relevance',
      title: '직무와의 관련성',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'blue'
    },
    {
      id: 'tone',
      title: '어조와 표현력',
      icon: <Lightbulb className="w-6 h-6" />,
      color: 'yellow'
    },
    {
      id: 'summary',
      title: '종합 평가',
      icon: <FileCheck className="w-6 h-6" />,
      color: 'indigo'
    }
  ]

  const getCurrentPageData = () => {
    if (!analysisData) return null
    
    const analysis = analysisData.analysis || ''
    
    switch (currentPage) {
      case 0: // 개요
        return {
          title: '분석 개요',
          content: `
자기소개서 분석 개요

분석 목표
이 보고서는 제출하신 자기소개서의 내용을 HR 전문가의 관점에서 종합적으로 분석합니다:
- 목표 설정의 명확성: 직무 목표와 장기 목표의 구체성
- 경험과 성과 강조: STAR 기법 활용과 정량적 성과 제시
- 문장 구조 및 가독성: 명확하고 간결한 표현
- 자기소개서의 흐름과 전개: 논리적이고 자연스러운 구성
- 직무와의 관련성: 지원 직무와의 연관성 강조
- 어조와 표현력: 적절하고 효과적인 표현

${analysis.includes('전반적인 평가') ? analysis.split('전반적인 평가')[1]?.split('목표 설정')[0] || '전체 평가 데이터를 불러오는 중...' : '분석 데이터를 불러오는 중...'}
          `
        }
      case 1: // 목표 설정의 명확성
        const goalsMatch = analysis.match(/목표 설정의 명확성.*?(?=경험과 성과|$)/s)
        return {
          title: '목표 설정의 명확성',
          content: goalsMatch ? goalsMatch[0] : `
목표 설정의 명확성

점수: 7/10

분석
자기소개서에서 제시한 직무 목표나 장기적인 목표가 얼마나 구체적이고 실현 가능한지 평가합니다

강점
직무와 관련된 경험을 바탕으로 한 목표 설정이 잘 드러나고 있습니다

개선점
목표가 다소 추상적입니다. 예를 들어, "이 직무에서 더 많은 기여를 하고 싶다"는 목표보다, "3년의 경험을 바탕으로 해당 분야에서 전문성을 발휘하고 싶다"와 같은 구체적인 목표를 제시하는 것이 좋습니다

구체적 개선 방법
- 구체적인 시간 프레임 설정 (예: 3년 내, 5년 후)
- 측정 가능한 목표 수립 (예: 전문 자격 취득, 특정 스킬 습득)
- 직무와의 연관성 명확화
          `
        }
      case 2: // 경험과 성과 강조
        const experienceMatch = analysis.match(/경험과 성과 강조.*?(?=문장 구조|$)/s)
        return {
          title: '경험과 성과 강조',
          content: experienceMatch ? experienceMatch[0] : `
경험과 성과 강조

점수: 8/10

분석
경험을 어떻게 서술하고 있는지, 성과를 얼마나 잘 구체화했는지에 대한 평가입니다

강점
팀 내에서 중요한 역할을 맡은 점과 협력하며 성과를 달성한 점은 매우 긍정적입니다

개선점
경험을 수치적으로 제시할 수 있으면 더 좋습니다. 예를 들어, "프로젝트를 통해 20% 성과 향상에 기여했다"와 같은 구체적인 성과를 포함하는 것이 좋습니다

구체적 개선 방법
- STAR 기법 활용 (상황-과제-행동-결과)
- 정량적 성과 제시 (수치, 비율, 기간 등)
- 개인적 성장과 배움 강조
- 지원 직무와의 연관성 명확화
          `
        }
      case 3: // 문장 구조 및 가독성
        const readabilityMatch = analysis.match(/문장 구조 및 가독성.*?(?=자기소개서의 흐름|$)/s)
        return {
          title: '문장 구조 및 가독성',
          content: readabilityMatch ? readabilityMatch[0] : `
문장 구조 및 가독성

점수: 6/10

분석
문장이 지나치게 길거나 복잡한 경우, 이를 어떻게 개선할 수 있는지에 대한 피드백을 제공합니다

강점
전반적으로 문장이 간결하지만, 개선할 여지가 있습니다

개선점
"여러 팀원들과 협력하여 많은 성과를 이루었으며, 이를 통해 팀워크와 문제 해결 능력을 키울 수 있었습니다"는 두 문장으로 나누는 것이 더 읽기 쉬울 것입니다

구체적 개선 방법
- 긴 문장을 두 개의 짧은 문장으로 분리
- 복잡한 문장 구조 단순화
- 명확하고 간결한 표현 사용
- 불필요한 수식어 제거
          `
        }
      case 4: // 자기소개서의 흐름과 전개
        const flowMatch = analysis.match(/자기소개서의 흐름과 전개.*?(?=직무와의 관련성|$)/s)
        return {
          title: '흐름과 전개',
          content: flowMatch ? flowMatch[0] : `
자기소개서의 흐름과 전개

점수: 7/10

분석
자기소개서가 일관되게 흐르고 있는지, 각 문단이 자연스럽게 이어지는지 평가합니다

강점
경험이 논리적으로 전개되고 있습니다

개선점
첫 문단에서 목표만 간단히 언급한 후, 후속 문단에서 경험을 풀어가는 방식이 더 자연스럽습니다

구체적 개선 방법
- 첫 문단에서 목표와 동기만 간단히 설명
- 각 문단별로 하나의 핵심 메시지 전달
- 문단 간 연결어구 활용
- 전체적인 스토리라인 구성
          `
        }
      case 5: // 직무와의 관련성
        const relevanceMatch = analysis.match(/직무와의 관련성.*?(?=어조와 표현력|$)/s)
        return {
          title: '직무와의 관련성',
          content: relevanceMatch ? relevanceMatch[0] : `
직무와의 관련성

점수: 7/10

분석
직무와의 연관성은 얼마나 잘 드러나 있는지, 자기소개서에서 직무와 본인의 경험을 연결하는 방식에 대해 평가합니다

강점
직무에 대한 경험을 잘 언급하고 있습니다

개선점
경험과 직무 연관성을 좀 더 명확히 하면 좋습니다. 예를 들어, "이 경험이 해당 직무에서 어떻게 도움이 될 수 있는지"를 추가하는 것이 더 효과적입니다

구체적 개선 방법
- 각 경험마다 직무와의 연관성 명시
- 직무에서 요구하는 역량과의 연결점 강조
- 업무 적용 가능성 구체화
- 조직 기여 방안 제시
          `
        }
      case 6: // 어조와 표현력
        const toneMatch = analysis.match(/어조와 표현력.*?(?=강점과 개선점|$)/s)
        return {
          title: '어조와 표현력',
          content: toneMatch ? toneMatch[0] : `
어조와 표현력

점수: 6/10

분석
자기소개서에서 사용하는 어조와 표현이 적절한지 평가합니다

강점
어조가 진지하고 전문적입니다

개선점
어조는 다소 격식적이지만, 조금 더 자연스럽고 자신감 있는 톤을 사용해 보세요

구체적 개선 방법
- 자연스럽고 자신감 있는 표현 사용
- 적절한 격식도 유지
- 개인적 감정과 열정 표현
- 면접관과의 소통감 조성
          `
        }
      case 7: // 종합 평가
        return {
          title: '종합 평가',
          content: `
종합 평가 및 권장사항

전반적인 평가
전반적으로 목표와 성과에 대한 표현이 훌륭하며, 특히 경험을 구체적으로 서술한 점이 인상적입니다. 다만, 직무 연관성을 더 강조하고, 문장 구조를 간결하게 만드는 것이 필요합니다.

주요 강점 요약
1. 구체적인 경험 기술: 실제 경험을 바탕으로 한 구체적인 사례가 잘 포함되어 있습니다
2. 논리적 구성: 문제상황부터 해결과정, 결과까지의 흐름이 자연스럽습니다
3. 전문적 어조: 진지하고 전문적인 톤으로 작성되었습니다

개선이 필요한 부분
1. 수치와 데이터 강화: 정량적 성과를 더 구체적으로 제시하시기 바랍니다
2. 직무 연관성 강화: 경험과 직무의 연결점을 더 명확히 하시기 바랍니다
3. 문장 구조 개선: 긴 문장을 간결하게 나누어 가독성을 높이시기 바랍니다

최종 권장사항
1. 각 경험마다 구체적인 수치나 결과 추가
2. 지원 직무와의 연관성을 더욱 명확하게 서술
3. 문장 구조를 간결하게 개선
4. 면접 준비를 위한 구체적인 답변 포인트 정리

다음 단계
이 분석 결과를 바탕으로 자기소개서를 개선하고, 면접 준비를 진행하시기 바랍니다.
          `
        }
      default:
        return null
    }
  }

  const handleDownload = () => {
    if (!analysisData) return

    // 전체 보고서 내용 생성
    let fullReport = ''
    
    // 헤더 정보
    fullReport += `자기소개서 분석 보고서\n`
    fullReport += `분석 일시: ${new Date().toLocaleString('ko-KR')}\n`
    fullReport += `원본 파일명: ${fileInfo?.original_name || 'N/A'}\n\n`
    fullReport += `${'='.repeat(50)}\n\n`

    // 각 페이지 내용 추가
    pages.forEach((page, index) => {
      const pageData = getPageDataByIndex(index)
      if (pageData) {
        fullReport += `[${index + 1}] ${pageData.title}\n`
        fullReport += `${'='.repeat(30)}\n`
        fullReport += pageData.content + '\n\n'
        fullReport += `${'='.repeat(50)}\n\n`
      }
    })

    // 전체 보고서 다운로드
    const element = document.createElement('a')
    const file = new Blob([fullReport], { type: 'text/plain;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = `${fileInfo?.original_name || '자기소개서'}_전체_분석보고서_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getPageDataByIndex = (index) => {
    if (!analysisData) return null
    
    const analysis = analysisData.analysis || ''
    
    switch (index) {
      case 0: // 개요
        return {
          title: '분석 개요',
          content: `자기소개서 분석 개요

분석 목표
이 보고서는 제출하신 자기소개서의 내용을 HR 전문가의 관점에서 종합적으로 분석합니다:
- 목표 설정의 명확성: 직무 목표와 장기 목표의 구체성
- 경험과 성과 강조: STAR 기법 활용과 정량적 성과 제시
- 문장 구조 및 가독성: 명확하고 간결한 표현
- 자기소개서의 흐름과 전개: 논리적이고 자연스러운 구성
- 직무와의 관련성: 지원 직무와의 연관성 강조
- 어조와 표현력: 적절하고 효과적인 표현

${analysis.includes('전반적인 평가') ? analysis.split('전반적인 평가')[1]?.split('목표 설정')[0] || '전체 평가 데이터를 불러오는 중...' : '분석 데이터를 불러오는 중...'}`
        }
      case 1: // 목표 설정의 명확성
        const goalsMatch = analysis.match(/목표 설정의 명확성.*?(?=경험과 성과|$)/s)
        return {
          title: '목표 설정의 명확성',
          content: goalsMatch ? goalsMatch[0] : `목표 설정의 명확성

점수: 7/10

분석
자기소개서에서 제시한 직무 목표나 장기적인 목표가 얼마나 구체적이고 실현 가능한지 평가합니다

강점
직무와 관련된 경험을 바탕으로 한 목표 설정이 잘 드러나고 있습니다

개선점
목표가 다소 추상적입니다. 예를 들어, "이 직무에서 더 많은 기여를 하고 싶다"는 목표보다, "3년의 경험을 바탕으로 해당 분야에서 전문성을 발휘하고 싶다"와 같은 구체적인 목표를 제시하는 것이 좋습니다

구체적 개선 방법
- 구체적인 시간 프레임 설정 (예: 3년 내, 5년 후)
- 측정 가능한 목표 수립 (예: 전문 자격 취득, 특정 스킬 습득)
- 직무와의 연관성 명확화`
        }
      case 2: // 경험과 성과 강조
        const experienceMatch = analysis.match(/경험과 성과 강조.*?(?=문장 구조|$)/s)
        return {
          title: '경험과 성과 강조',
          content: experienceMatch ? experienceMatch[0] : `경험과 성과 강조

점수: 8/10

분석
경험을 어떻게 서술하고 있는지, 성과를 얼마나 잘 구체화했는지에 대한 평가입니다

강점
팀 내에서 중요한 역할을 맡은 점과 협력하며 성과를 달성한 점은 매우 긍정적입니다

개선점
경험을 수치적으로 제시할 수 있으면 더 좋습니다. 예를 들어, "프로젝트를 통해 20% 성과 향상에 기여했다"와 같은 구체적인 성과를 포함하는 것이 좋습니다

구체적 개선 방법
- STAR 기법 활용 (상황-과제-행동-결과)
- 정량적 성과 제시 (수치, 비율, 기간 등)
- 개인적 성장과 배움 강조
- 지원 직무와의 연관성 명확화`
        }
      case 3: // 문장 구조 및 가독성
        const readabilityMatch = analysis.match(/문장 구조 및 가독성.*?(?=자기소개서의 흐름|$)/s)
        return {
          title: '문장 구조 및 가독성',
          content: readabilityMatch ? readabilityMatch[0] : `문장 구조 및 가독성

점수: 6/10

분석
문장이 지나치게 길거나 복잡한 경우, 이를 어떻게 개선할 수 있는지에 대한 피드백을 제공합니다

강점
전반적으로 문장이 간결하지만, 개선할 여지가 있습니다

개선점
"여러 팀원들과 협력하여 많은 성과를 이루었으며, 이를 통해 팀워크와 문제 해결 능력을 키울 수 있었습니다"는 두 문장으로 나누는 것이 더 읽기 쉬울 것입니다

구체적 개선 방법
- 긴 문장을 두 개의 짧은 문장으로 분리
- 복잡한 문장 구조 단순화
- 명확하고 간결한 표현 사용
- 불필요한 수식어 제거`
        }
      case 4: // 자기소개서의 흐름과 전개
        const flowMatch = analysis.match(/자기소개서의 흐름과 전개.*?(?=직무와의 관련성|$)/s)
        return {
          title: '흐름과 전개',
          content: flowMatch ? flowMatch[0] : `자기소개서의 흐름과 전개

점수: 7/10

분석
자기소개서가 일관되게 흐르고 있는지, 각 문단이 자연스럽게 이어지는지 평가합니다

강점
경험이 논리적으로 전개되고 있습니다

개선점
첫 문단에서 목표만 간단히 언급한 후, 후속 문단에서 경험을 풀어가는 방식이 더 자연스럽습니다

구체적 개선 방법
- 첫 문단에서 목표와 동기만 간단히 설명
- 각 문단별로 하나의 핵심 메시지 전달
- 문단 간 연결어구 활용
- 전체적인 스토리라인 구성`
        }
      case 5: // 직무와의 관련성
        const relevanceMatch = analysis.match(/직무와의 관련성.*?(?=어조와 표현력|$)/s)
        return {
          title: '직무와의 관련성',
          content: relevanceMatch ? relevanceMatch[0] : `직무와의 관련성

점수: 7/10

분석
직무와의 연관성은 얼마나 잘 드러나 있는지, 자기소개서에서 직무와 본인의 경험을 연결하는 방식에 대해 평가합니다

강점
직무에 대한 경험을 잘 언급하고 있습니다

개선점
경험과 직무 연관성을 좀 더 명확히 하면 좋습니다. 예를 들어, "이 경험이 해당 직무에서 어떻게 도움이 될 수 있는지"를 추가하는 것이 더 효과적입니다

구체적 개선 방법
- 각 경험마다 직무와의 연관성 명시
- 직무에서 요구하는 역량과의 연결점 강조
- 업무 적용 가능성 구체화
- 조직 기여 방안 제시`
        }
      case 6: // 어조와 표현력
        const toneMatch = analysis.match(/어조와 표현력.*?(?=강점과 개선점|$)/s)
        return {
          title: '어조와 표현력',
          content: toneMatch ? toneMatch[0] : `어조와 표현력

점수: 6/10

분석
자기소개서에서 사용하는 어조와 표현이 적절한지 평가합니다

강점
어조가 진지하고 전문적입니다

개선점
어조는 다소 격식적이지만, 조금 더 자연스럽고 자신감 있는 톤을 사용해 보세요

구체적 개선 방법
- 자연스럽고 자신감 있는 표현 사용
- 적절한 격식도 유지
- 개인적 감정과 열정 표현
- 면접관과의 소통감 조성`
        }
      case 7: // 종합 평가
        return {
          title: '종합 평가',
          content: `종합 평가 및 권장사항

전반적인 평가
전반적으로 목표와 성과에 대한 표현이 훌륭하며, 특히 경험을 구체적으로 서술한 점이 인상적입니다. 다만, 직무 연관성을 더 강조하고, 문장 구조를 간결하게 만드는 것이 필요합니다.

주요 강점 요약
1. 구체적인 경험 기술: 실제 경험을 바탕으로 한 구체적인 사례가 잘 포함되어 있습니다
2. 논리적 구성: 문제상황부터 해결과정, 결과까지의 흐름이 자연스럽습니다
3. 전문적 어조: 진지하고 전문적인 톤으로 작성되었습니다

개선이 필요한 부분
1. 수치와 데이터 강화: 정량적 성과를 더 구체적으로 제시하시기 바랍니다
2. 직무 연관성 강화: 경험과 직무의 연결점을 더 명확히 하시기 바랍니다
3. 문장 구조 개선: 긴 문장을 간결하게 나누어 가독성을 높이시기 바랍니다

최종 권장사항
1. 각 경험마다 구체적인 수치나 결과 추가
2. 지원 직무와의 연관성을 더욱 명확하게 서술
3. 문장 구조를 간결하게 개선
4. 면접 준비를 위한 구체적인 답변 포인트 정리

다음 단계
이 분석 결과를 바탕으로 자기소개서를 개선하고, 면접 준비를 진행하시기 바랍니다.`
        }
      default:
        return null
    }
  }

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const currentPageData = getCurrentPageData()
  const currentPageInfo = pages[currentPage]

  if (!currentPageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/resume')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                돌아가기
              </button>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-${currentPageInfo.color}-500 rounded-lg flex items-center justify-center`}>
                  {React.cloneElement(currentPageInfo.icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{currentPageData.title}</h1>
                  <p className="text-gray-600">자기소개서 분석 보고서</p>
                </div>
              </div>
            </div>
            {currentPage === pages.length - 1 ? (
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>📄 전체 보고서 다운로드</span>
              </button>
            ) : (
              <div className="text-gray-500 text-sm text-right">
                <div>마지막 페이지에서</div>
                <div>전체 보고서를 다운로드할 수 있습니다</div>
              </div>
            )}
          </div>
        </div>

        {/* 페이지 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPage(index)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === index
                      ? `bg-${page.color}-100 text-${page.color}-700 border-2 border-${page.color}-300`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {React.cloneElement(page.icon, { className: "w-4 h-4" })}
                  <span>{page.title}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentPage + 1} / {pages.length}
              </span>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="text-gray-800 leading-relaxed">
            {currentPageData.content.split('\n').map((line, index) => {
              // 빈 줄 처리
              if (!line.trim()) {
                return <br key={index} />
              }
              
              // 제목 처리
              if (line.startsWith('# ')) {
                return (
                  <h1 key={index} className="text-3xl font-bold text-gray-900 mt-8 mb-6 pb-3 border-b-2 border-blue-400 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-lg">
                    {line.replace('# ', '')}
                  </h1>
                )
              }
              
              // 부제목 처리
              if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold text-gray-800 mt-6 mb-4 pb-2 border-b-2 border-gray-300 bg-gray-50 px-3 py-2 rounded-lg">
                    {line.replace('## ', '')}
                  </h2>
                )
              }
              
              // 소제목 처리
              if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-bold text-gray-700 mt-5 mb-3 bg-blue-50 px-3 py-2 rounded-lg border-l-4 border-blue-400">
                    {line.replace('### ', '')}
                  </h3>
                )
              }
              
              // 특정 키워드 제목 처리 (점수, 분석, 강점, 개선점 등)
              if (/^(점수|분석|강점|개선점|구체적 개선 방법|현재 상태|문제점|기대 효과|전반적인 평가|주요 강점 요약|개선이 필요한 부분|최종 권장사항|다음 단계):/.test(line)) {
                return (
                  <h4 key={index} className="text-lg font-bold text-gray-800 mt-5 mb-3 bg-gradient-to-r from-green-50 to-blue-50 px-3 py-2 rounded-lg border-l-4 border-green-400">
                    {line}
                  </h4>
                )
              }
              
              // 리스트 항목 처리
              if (line.startsWith('- ')) {
                return (
                  <div key={index} className="ml-4 mb-2 p-3 bg-gray-50 rounded border-l-4 border-blue-300">
                    <span className="text-gray-700">{line.replace('- ', '')}</span>
                  </div>
                )
              }
              
              // 번호 리스트 처리
              if (/^\d+\./.test(line)) {
                return (
                  <div key={index} className="ml-4 mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <span className="text-gray-700 font-medium">{line}</span>
                  </div>
                )
              }
              
              // 일반 텍스트 처리
              return (
                <p key={index} className="mb-3 text-gray-700 leading-relaxed">
                  {line}
                </p>
              )
            })}
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>이전</span>
          </button>

          <div className="flex items-center space-x-2">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  currentPage === index ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage === pages.length - 1}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentPage === pages.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <span>다음</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResumeReport


