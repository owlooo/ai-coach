import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAuth } from '../contexts/AuthContext'
import { resumeService } from '../lib/database'
import { storageService } from '../lib/storage'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react'

const ResumeUpload = () => {
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles) => {
    console.log('=== 파일 드롭 이벤트 ===')
    console.log('받은 파일들:', acceptedFiles)
    
    const file = acceptedFiles[0]
    if (file) {
      console.log('파일 선택됨:', file.name, file.size, 'bytes')
      setUploadedFile(file)
      setError('')
      setAnalysisResult(null)
    } else {
      console.log('파일이 선택되지 않음')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const analyzeResume = async () => {
    if (!uploadedFile || isAnalyzing) return

    setIsAnalyzing(true)
    setError('')

    try {
      // 1. 파일 정보 로깅
      console.log('=== PDF 분석 시작 ===')
      console.log('업로드된 파일:', uploadedFile.name, uploadedFile.size, 'bytes')
      console.log('현재 환경:', import.meta.env.MODE)
      console.log('사용자 정보:', user ? '로그인됨' : '비로그인')

      // 2. 실제로는 백엔드 API 호출 (PDF 텍스트 추출 + GPT 분석)
      // const formData = new FormData()
      // formData.append('file', uploadedFile)
      // formData.append('userId', user?.uid || 'anonymous')
      // 
      // const response = await fetch('/api/analyze-resume', {
      //   method: 'POST',
      //   body: formData
      // })
      // const result = await response.json()

      // 3. Firebase Storage에 PDF 파일 업로드 (강제 시도)
      let uploadResult = { url: 'local-file', path: 'local-path' }
      
      console.log('=== Storage 업로드 시작 ===')
      console.log('사용자 ID:', user?.uid || '비로그인')
      console.log('파일 정보:', uploadedFile.name, uploadedFile.size, 'bytes')
      
      try {
        // 로그인 여부와 관계없이 Storage 업로드 시도
        const userId = user?.uid || 'anonymous'
        uploadResult = await storageService.uploadResumePDF(userId, uploadedFile)
        
        if (uploadResult.error) {
          console.error('Storage 업로드 실패:', uploadResult.error)
          console.error('에러 코드:', uploadResult.error.code)
          console.error('에러 메시지:', uploadResult.error.message)
          uploadResult = { url: 'local-file', path: 'local-path' }
        } else {
          console.log('✅ Storage 업로드 성공!')
          console.log('파일 URL:', uploadResult.url)
          console.log('파일 경로:', uploadResult.path)
        }
      } catch (storageError) {
        console.error('Storage 업로드 예외:', storageError)
        console.error('예외 코드:', storageError.code)
        console.error('예외 메시지:', storageError.message)
        uploadResult = { url: 'local-file', path: 'local-path' }
      }

      // 모의 분석 시간 (1초)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockResult = {
        fileName: uploadedFile.name,
        fileUrl: uploadResult.url || 'local-file',
        filePath: uploadResult.path || 'local-path',
        content: {
          personalInfo: '김면접, 25세, 컴퓨터공학과 졸업',
          experience: '삼성전자 인턴십 6개월, 스타트업 개발 경험 1년',
          skills: 'React, Node.js, Python, AWS',
          achievements: '해커톤 우승, 오픈소스 기여'
        },
        feedback: {
          strengths: [
            '구체적인 경험과 성과가 잘 드러남',
            '기술 스택이 명확하게 정리됨',
            '인턴십과 프로젝트 경험이 풍부함'
          ],
          improvements: [
            'STAR 기법을 활용한 구체적인 사례 설명 필요',
            '팀워크와 리더십 경험 추가 권장',
            '목표와 비전에 대한 명확한 표현 필요'
          ],
          score: 78
        },
        questions: [
          {
            category: '직무',
            question: 'React와 Node.js를 사용한 프로젝트에서 가장 어려웠던 점은 무엇이었나요?',
            difficulty: 'medium'
          },
          {
            category: '경험',
            question: '삼성전자 인턴십에서 배운 가장 중요한 것은 무엇인가요?',
            difficulty: 'easy'
          },
          {
            category: '가치관',
            question: '개발자로서 추구하는 가치는 무엇인가요?',
            difficulty: 'medium'
          },
          {
            category: '압박',
            question: '프로젝트 마감일이 다가왔는데 예상보다 많은 버그가 발견되었다면 어떻게 대처하시겠나요?',
            difficulty: 'hard'
          }
        ]
      }

      // 4. Firestore에 분석 결과 저장 (선택적)
      if (user) {
        try {
          const saveResult = await resumeService.saveResumeAnalysis(user.uid, mockResult)
          if (saveResult.error) {
            console.warn('Firestore 저장 실패 (권한 문제), 로컬에서만 표시:', saveResult.error.message)
          } else {
            console.log('Firestore 저장 성공:', saveResult.data)
          }
        } catch (firestoreError) {
          console.warn('Firestore 저장 실패 (권한 문제), 로컬에서만 표시:', firestoreError.message)
        }
      }

      // 분석 결과 설정 (로컬에서만 표시)
      console.log('=== 분석 완료 ===')
      setAnalysisResult(mockResult)
    } catch (err) {
      console.error('=== 분석 오류 ===', err)
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      console.log('=== 분석 종료 ===')
      setIsAnalyzing(false)
    }
  }

  const downloadQuestions = () => {
    if (!analysisResult) return
    
    const questionsText = analysisResult.questions
      .map((q, index) => `${index + 1}. [${q.category}] ${q.question}`)
      .join('\n\n')
    
    const blob = new Blob([questionsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '예상질문.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setAnalysisResult(null)
    setError('')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">자기소개서 분석</h1>
        <p className="text-gray-600">
          PDF 파일을 업로드하여 자기소개서를 분석하고 맞춤형 피드백을 받아보세요
        </p>
      </div>

      {/* 파일 업로드 영역 */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">파일 업로드</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive
              ? 'border-primary-500 bg-primary-50'
              : uploadedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          
          {uploadedFile ? (
            <div className="space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={analyzeResume}
                disabled={isAnalyzing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isAnalyzing ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    분석 시작
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? '파일을 여기에 놓으세요' : 'PDF 파일을 드래그하거나 클릭하여 업로드'}
                </p>
                <p className="text-sm text-gray-500">최대 10MB, PDF 형식만 지원</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {/* 분석 결과 */}
      {analysisResult && (
        <div className="space-y-6">
          {/* 점수 및 요약 */}
          <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">분석 결과</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadQuestions}
                  className="btn-secondary text-sm"
                >
                  <Download className="mr-1 h-4 w-4" />
                  질문 다운로드
                </button>
                <button
                  onClick={resetUpload}
                  className="btn-accent text-sm"
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  새 파일 업로드
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary-600">
                  {analysisResult.feedback.score}
                </div>
                <div className="text-sm text-gray-600">점</div>
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${analysisResult.feedback.score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  전반적으로 잘 작성된 자기소개서입니다
                </p>
              </div>
            </div>
          </div>

          {/* 피드백 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 강점 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                강점
              </h3>
              <ul className="space-y-2">
                {analysisResult.feedback.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 개선점 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-orange-700 mb-4 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                개선점
              </h3>
              <ul className="space-y-2">
                {analysisResult.feedback.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 예상 질문 */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              예상 질문 ({analysisResult.questions.length}개)
            </h3>
            <div className="space-y-4">
              {analysisResult.questions.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {q.category}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      q.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {q.difficulty === 'easy' ? '쉬움' : q.difficulty === 'medium' ? '보통' : '어려움'}
                    </span>
                  </div>
                  <p className="text-gray-700">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResumeUpload
