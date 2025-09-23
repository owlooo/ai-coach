import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { interviewService } from '../lib/database'
import { storageService } from '../lib/storage'
import Webcam from 'react-webcam'
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Camera,
  AlertCircle,
  CheckCircle,
  Loader,
  Volume2,
  VolumeX
} from 'lucide-react'

const InterviewSimulation = () => {
  const { user } = useAuth()
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [behaviorData, setBehaviorData] = useState({ awayCount: 0, eyeContactLoss: 0 })
  const [interviewData, setInterviewData] = useState([])
  const [currentInterviewId, setCurrentInterviewId] = useState(null)
  const [error, setError] = useState('')
  
  const webcamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const analysisIntervalRef = useRef(null)
  
  const navigate = useNavigate()

  // 모의 질문 데이터
  const mockQuestions = [
    {
      id: 1,
      category: '직무',
      question: 'React와 Node.js를 사용한 프로젝트에서 가장 어려웠던 점은 무엇이었나요?',
      difficulty: 'medium'
    },
    {
      id: 2,
      category: '경험',
      question: '삼성전자 인턴십에서 배운 가장 중요한 것은 무엇인가요?',
      difficulty: 'easy'
    },
    {
      id: 3,
      category: '가치관',
      question: '개발자로서 추구하는 가치는 무엇인가요?',
      difficulty: 'medium'
    },
    {
      id: 4,
      category: '압박',
      question: '프로젝트 마감일이 다가왔는데 예상보다 많은 버그가 발견되었다면 어떻게 대처하시겠나요?',
      difficulty: 'hard'
    }
  ]

  const startInterview = async () => {
    if (!user) return

    setIsInterviewStarted(true)
    setCurrentQuestionIndex(0)
    setInterviewData([])
    setBehaviorData({ awayCount: 0, eyeContactLoss: 0 })
    
    // 면접 세션 생성 및 저장
    const interviewSession = {
      status: 'in_progress',
      totalQuestions: mockQuestions.length,
      currentQuestion: 0,
      startTime: new Date().toISOString(),
      behaviorData: { awayCount: 0, eyeContactLoss: 0 },
      answers: []
    }

    const result = await interviewService.saveInterviewSession(user.uid, interviewSession)
    if (result.error) {
      setError('면접 세션 생성에 실패했습니다.')
      return
    }

    setCurrentInterviewId(result.id)
    
    // 행동 분석 시작 (모의 데이터)
    startBehaviorAnalysis()
  }

  const startBehaviorAnalysis = () => {
    analysisIntervalRef.current = setInterval(() => {
      // 실제로는 YOLO 모델로 분석
      setBehaviorData(prev => ({
        awayCount: prev.awayCount + Math.random() * 0.1,
        eyeContactLoss: prev.eyeContactLoss + Math.random() * 0.2
      }))
    }, 1000)
  }

  const stopBehaviorAnalysis = () => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }
  }

  const speakQuestion = (question) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question)
      utterance.lang = 'ko-KR'
      utterance.rate = 0.9
      utterance.pitch = 1
      
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      
      speechSynthesis.speak(utterance)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      })
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError('마이크 접근 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob) => {
    if (!user || !currentInterviewId) return

    setIsAnalyzing(true)
    
    try {
      // 1. 음성 파일을 Firebase Storage에 업로드
      const uploadResult = await storageService.uploadAudioFile(
        user.uid, 
        audioBlob, 
        currentInterviewId, 
        currentQuestionIndex
      )
      
      if (uploadResult.error) {
        throw uploadResult.error
      }

      // 2. 실제로는 STT + LLM 평가 API 호출
      // const response = await fetch('/api/evaluate-answer', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     audioUrl: uploadResult.url,
      //     question: mockQuestions[currentQuestionIndex].question,
      //     userId: user.uid,
      //     interviewId: currentInterviewId
      //   })
      // })
      // const evaluation = await response.json()

      // 임시 모의 데이터
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockEvaluation = {
        audioUrl: uploadResult.url,
        audioPath: uploadResult.path,
        answer: "React 프로젝트에서 가장 어려웠던 점은 상태 관리였습니다. Redux를 처음 사용할 때 복잡한 액션과 리듀서 구조를 이해하는데 시간이 걸렸지만, 공식 문서와 튜토리얼을 통해 학습했습니다.",
        evaluation: {
          specificity: 85,
          jobFit: 90,
          logic: 80,
          star: 75
        },
        feedback: "구체적인 기술과 학습 과정이 잘 드러났습니다. STAR 기법을 더 활용하면 더욱 좋을 것 같습니다.",
        score: 82
      }

      const currentQuestion = mockQuestions[currentQuestionIndex]
      const interviewEntry = {
        question: currentQuestion.question,
        category: currentQuestion.category,
        difficulty: currentQuestion.difficulty,
        questionIndex: currentQuestionIndex,
        ...mockEvaluation
      }

      setInterviewData(prev => [...prev, interviewEntry])
      
      // 3. 면접 세션 업데이트
      await interviewService.updateInterviewSession(user.uid, currentInterviewId, {
        currentQuestion: currentQuestionIndex + 1,
        answers: [...interviewData, interviewEntry]
      })
      
      // 다음 질문으로 이동
      if (currentQuestionIndex < mockQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      } else {
        // 면접 완료
        finishInterview()
      }
    } catch (err) {
      setError('음성 분석 중 오류가 발생했습니다.')
      console.error('음성 분석 오류:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const finishInterview = async () => {
    setIsInterviewStarted(false)
    stopBehaviorAnalysis()
    
    // 면접 세션이 있는 경우에만 업데이트
    if (user && currentInterviewId) {
      const totalScore = interviewData.length > 0 
        ? Math.round(interviewData.reduce((sum, item) => sum + item.score, 0) / interviewData.length)
        : 0

      try {
        await interviewService.updateInterviewSession(user.uid, currentInterviewId, {
          status: 'completed',
          endTime: new Date().toISOString(),
          totalScore,
          behaviorData,
          answers: interviewData
        })
      } catch (error) {
        console.error('면접 세션 업데이트 실패:', error)
      }
    }

    // 결과 페이지로 이동
    navigate('/results', { 
      state: { 
        interviewData, 
        behaviorData,
        totalQuestions: mockQuestions.length,
        interviewId: currentInterviewId
      } 
    })
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      finishInterview()
    }
  }

  useEffect(() => {
    return () => {
      stopBehaviorAnalysis()
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const currentQuestion = mockQuestions[currentQuestionIndex]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">면접 시뮬레이션</h1>
        <p className="text-gray-600">
          AI 면접관과 함께 실제 면접처럼 연습해보세요
        </p>
      </div>

      {!isInterviewStarted ? (
        /* 면접 시작 전 */
        <div className="card text-center">
          <div className="space-y-6">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Mic className="h-12 w-12 text-primary-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                면접 준비가 완료되었습니다
              </h2>
              <p className="text-gray-600 mb-4">
                총 {mockQuestions.length}개의 질문으로 구성된 면접을 시작합니다
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2">면접 안내사항</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 질문은 음성으로 재생됩니다</li>
                <li>• 답변은 녹음하여 분석됩니다</li>
                <li>• 카메라로 행동을 분석합니다</li>
                <li>• 각 질문당 2분의 답변 시간이 있습니다</li>
              </ul>
            </div>

            <button
              onClick={startInterview}
              className="btn-primary text-lg px-8 py-3"
            >
              면접 시작하기
            </button>
          </div>
        </div>
      ) : (
        /* 면접 진행 중 */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 질문 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 진행 상황 */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  질문 {currentQuestionIndex + 1} / {mockQuestions.length}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentQuestion.difficulty === 'easy' ? '쉬움' : 
                     currentQuestion.difficulty === 'medium' ? '보통' : '어려움'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {currentQuestion.category}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / mockQuestions.length) * 100}%` }}
                ></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {currentQuestion.question}
                </h3>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => speakQuestion(currentQuestion.question)}
                    disabled={isPlaying}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <VolumeX className="mr-2 h-4 w-4" />
                    ) : (
                      <Volume2 className="mr-2 h-4 w-4" />
                    )}
                    {isPlaying ? '재생 중...' : '질문 듣기'}
                  </button>
                </div>
              </div>
            </div>

            {/* 답변 녹음 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">답변 녹음</h3>
              
              {!isRecording && !isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="h-10 w-10 text-red-600" />
                  </div>
                  <p className="text-gray-600">질문을 듣고 답변을 준비한 후 녹음을 시작하세요</p>
                  <button
                    onClick={startRecording}
                    className="btn-primary"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    녹음 시작
                  </button>
                </div>
              ) : isRecording ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <MicOff className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-gray-600">녹음 중... 답변을 계속하세요</p>
                  <button
                    onClick={stopRecording}
                    className="btn-secondary"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    녹음 중지
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <Loader className="h-10 w-10 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-gray-600">답변을 분석하고 있습니다...</p>
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            {/* 답변 결과 */}
            {interviewData.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 답변 결과</h3>
                {interviewData.slice(-1).map((entry, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">점수</span>
                      <span className="text-lg font-bold text-primary-600">{entry.score}점</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>피드백:</strong> {entry.feedback}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>구체성: {entry.evaluation.specificity}점</div>
                      <div>직무적합성: {entry.evaluation.jobFit}점</div>
                      <div>논리성: {entry.evaluation.logic}점</div>
                      <div>STAR 기법: {entry.evaluation.star}점</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 행동 분석 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">행동 분석</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">자리 비움</span>
                  <span className="text-lg font-bold text-orange-600">
                    {Math.round(behaviorData.awayCount)}회
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">시선 이탈</span>
                  <span className="text-lg font-bold text-red-600">
                    {Math.round(behaviorData.eyeContactLoss)}회
                  </span>
                </div>
              </div>
            </div>

            {/* 카메라 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">화면</h3>
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  className="w-full h-48 object-cover rounded-lg"
                  audio={false}
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: "user"
                  }}
                />
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* 면접 제어 */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">면접 제어</h3>
              <div className="space-y-3">
                <button
                  onClick={nextQuestion}
                  disabled={isRecording || isAnalyzing}
                  className="w-full btn-secondary disabled:opacity-50"
                >
                  다음 질문
                </button>
                <button
                  onClick={finishInterview}
                  className="w-full btn-primary"
                >
                  면접 종료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewSimulation
