import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mic, MicOff, Play, Pause, Video, VideoOff, Camera, CameraOff, ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

const InterviewSimulation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  // 상태 관리
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [answers, setAnswers] = useState([])
  const [questions, setQuestions] = useState([])
  const [isResumeBased, setIsResumeBased] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resumeContent, setResumeContent] = useState('')
  const [questionsGenerated, setQuestionsGenerated] = useState(false)
  const hasInitialized = useRef(false)

  // 전역 변수로 사용자 ID 관리 (Firebase Auth UID만 사용)
  if (!window.interviewUserId) {
    console.log('getUserId 호출됨:', { user, userUid: user?.uid })
    
    // Firebase Authentication 사용자가 있으면 해당 사용자 ID 사용
    if (user && user.uid) {
      console.log('Firebase 사용자 ID 사용:', user.uid)
      window.interviewUserId = user.uid
    } else {
      // 로그인하지 않은 사용자는 에러 처리
      console.error('로그인이 필요합니다. 먼저 로그인해주세요.')
      window.interviewUserId = null
    }
  }
  
  const userId = window.interviewUserId
  
  // 음성 녹음 관련 상태
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [audioURL, setAudioURL] = useState('')
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  
  // 웹캠 관련 상태
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [cameraPermission, setCameraPermission] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  
  
  // 추가 질문 관련 상태
  const [showFollowup, setShowFollowup] = useState(false)
  const [followupQuestion, setFollowupQuestion] = useState('')
  const [followupAnswer, setFollowupAnswer] = useState('')
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState(false)
  
  // 팝업창 상태
  const [showPopup, setShowPopup] = useState(false)
  const [popupTitle, setPopupTitle] = useState('')
  const [popupContent, setPopupContent] = useState('')
  const [popupType, setPopupType] = useState('followup') // 'followup' 또는 'answer'

  // 컴포넌트 마운트 시 질문 생성
  useEffect(() => {
    const initializeInterview = async () => {
      // 이미 초기화되었으면 중복 실행 방지
      if (hasInitialized.current) {
        console.log('이미 초기화되었습니다.')
        return
      }
      
      hasInitialized.current = true
      
      try {
        // 질문이 아직 생성되지 않았을 때만 실행
        if (!questionsGenerated && questions.length === 0) {
          await generateQuestions()
        }
        await initializeCamera() // 웹캠 초기화
      } catch (error) {
        console.error('면접 초기화 에러:', error)
        hasInitialized.current = false // 에러 발생 시 재시도 가능하도록 리셋
      }
    }
    
    initializeInterview()
  }, []) // 의존성 배열을 비워서 한 번만 실행

  // 웹캠 권한 요청 및 초기화
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraOn(true)
        setCameraPermission('granted')
      }
    } catch (error) {
      console.error('웹캠 접근 실패:', error)
      setCameraPermission('denied')
      setIsCameraOn(false)
    }
  }

  // 웹캠 토글
  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera()
    } else {
      initializeCamera()
    }
  }

  // 웹캠 끄기
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setIsCameraOn(false)
    }
  }

  // 자기소개서 기반 질문 생성
  const generateQuestions = useCallback(async () => {
    // 이미 로딩 중이거나 질문이 이미 있으면 중복 실행 방지
    if (loading || questions.length > 0 || questionsGenerated || window.questionGenerationInProgress) {
      console.log('이미 질문 생성 중이거나 질문이 이미 있습니다.')
      return
    }
    
    try {
      setLoading(true)
      setQuestionsGenerated(true)
      console.log('질문 생성 시작...')
      
      // 중복 실행 방지를 위한 플래그 설정
      window.questionGenerationInProgress = true
      
      // 자기소개서 데이터 가져오기 (localStorage 또는 props에서)
      const savedResumeData = localStorage.getItem('lastResumeAnalysis')
      let resumeContent = ''
      
      if (savedResumeData) {
        try {
          const parsedData = JSON.parse(savedResumeData)
          resumeContent = parsedData.analysis || ''
          setResumeContent(resumeContent)
        } catch (e) {
          console.error('자기소개서 데이터 파싱 실패:', e)
        }
      }

      // 백엔드에 질문 생성 요청
      const response = await fetch('http://localhost:8000/api/interview/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_count: 5,
          user_id: userId
        })
      })

      if (!response.ok) {
        throw new Error('질문 생성 실패')
      }

      const data = await response.json()
      
      if (data.success) {
        setQuestions(data.data.questions)
        setIsResumeBased(data.data.is_resume_based)
        setQuestionsGenerated(true) // 성공적으로 생성 완료
      } else {
        throw new Error(data.detail || '질문 생성 실패')
      }
    } catch (error) {
      console.error('질문 생성 에러:', error)
      // 기본 질문으로 폴백
      setQuestions([
        "자기소개를 해주세요.",
        "지원하신 직무에 대한 동기를 말씀해주세요.",
        "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요.",
        "팀워크를 발휘했던 경험을 말씀해주세요.",
        "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요."
      ])
      setIsResumeBased(false)
      setQuestionsGenerated(true) // 에러가 발생해도 생성 완료로 표시
    } finally {
      setLoading(false)
      window.questionGenerationInProgress = false
    }
  }, [loading, questions.length, questionsGenerated, userId])

  // 추가 질문 생성
  const generateFollowupQuestion = async (originalQuestion, answer) => {
    try {
      setIsGeneratingFollowup(true)
      
      const response = await fetch('http://localhost:8000/api/interview/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_question: originalQuestion,
          answer: answer,
          resume_content: resumeContent
        })
      })

      if (!response.ok) {
        throw new Error('추가 질문 생성 실패')
      }

      const data = await response.json()
      
      if (data.success) {
        const followup = data.data.followup_question
        if (followup && !followup.includes('추가 질문이 필요하지 않습니다')) {
          setFollowupQuestion(followup)
          setPopupTitle('추가 질문')
          setPopupContent(followup)
          setPopupType('followup')
          setShowPopup(true)
        }
      }
    } catch (error) {
      console.error('추가 질문 생성 에러:', error)
    } finally {
      setIsGeneratingFollowup(false)
    }
  }

  // 녹음 시작/중지
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // 음성 녹음 시작
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioURL = URL.createObjectURL(audioBlob)
        setAudioURL(audioURL)
        setAudioChunks(audioChunks)
        
        // 녹음된 오디오를 텍스트로 변환하는 로직
        convertAudioToText(audioBlob)
      }

      mediaRecorder.start()
      setMediaRecorder(mediaRecorder)
      setIsRecordingAudio(true)
      setIsRecording(true)
    } catch (error) {
      console.error('음성 녹음 시작 실패:', error)
      alert('마이크 권한이 필요합니다.')
    }
  }

  // 음성 녹음 중지
  const stopAudioRecording = () => {
    if (mediaRecorder && isRecordingAudio) {
      mediaRecorder.stop()
      setIsRecordingAudio(false)
      setIsRecording(false)
      
      // 모든 트랙 중지
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
  }

  // 오디오를 텍스트로 변환
  const convertAudioToText = async (audioBlob) => {
    try {
      // FormData 생성
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.wav')
      formData.append('user_id', userId)
      
      // STT API 호출
      const response = await fetch('http://localhost:8000/api/interview/speech-to-text', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('음성 인식 실패')
      }
      
      const result = await response.json()
      
      if (result.success) {
        const transcribedText = result.data.text
        
        // 음성 인식 결과가 유효한지 확인
        if (transcribedText && transcribedText.trim()) {
          const newAnswer = {
            questionIndex: currentQuestion,
            question: questions[currentQuestion],
            answer: transcribedText.trim(),
            timestamp: new Date().toISOString(),
            hasAudio: true,
            audioURL: audioURL,
            audioFileURL: result.data.audio_url // Firebase Storage URL
          }
          
          setAnswers(prev => [...prev, newAnswer])
          
          // 추가 질문 생성 시도
          setTimeout(() => {
            generateFollowupQuestion(questions[currentQuestion], newAnswer.answer)
          }, 1000)
          
          // 성공 메시지 표시
          setPopupTitle('음성 인식 완료')
          setPopupContent(`인식된 텍스트: "${transcribedText.trim()}"`)
          setPopupType('answer')
          setShowPopup(true)
        } else {
          // 음성 인식 결과가 비어있으면 수동 입력 요청
          const userAnswer = prompt(`음성 인식 결과가 비어있습니다.\n\n질문: ${questions[currentQuestion]}\n\n답변을 텍스트로 입력해주세요:`)
          
          if (userAnswer && userAnswer.trim()) {
            const newAnswer = {
              questionIndex: currentQuestion,
              question: questions[currentQuestion],
              answer: userAnswer.trim(),
              timestamp: new Date().toISOString(),
              hasAudio: true,
              audioURL: audioURL,
              audioFileURL: result.data.audio_url
            }
            
            setAnswers(prev => [...prev, newAnswer])
            
            setTimeout(() => {
              generateFollowupQuestion(questions[currentQuestion], newAnswer.answer)
            }, 1000)
          }
        }
      } else {
        throw new Error(result.detail || '음성 인식 실패')
      }
    } catch (error) {
      console.error('STT API 호출 에러:', error)
      
      // STT 실패 시 수동 입력으로 폴백
      const userAnswer = prompt(`음성 인식에 실패했습니다.\n\n질문: ${questions[currentQuestion]}\n\n답변을 텍스트로 입력해주세요 (음성 녹음 완료):`)
      
      if (userAnswer && userAnswer.trim()) {
        const newAnswer = {
          questionIndex: currentQuestion,
          question: questions[currentQuestion],
          answer: userAnswer.trim(),
          timestamp: new Date().toISOString(),
          hasAudio: true,
          audioURL: audioURL
        }
        
        setAnswers(prev => [...prev, newAnswer])
        
        setTimeout(() => {
          generateFollowupQuestion(questions[currentQuestion], newAnswer.answer)
        }, 1000)
      } else {
        alert('답변을 입력해주세요.')
      }
    }
  }

  // 녹음 시작 (음성 녹음 사용)
  const startRecording = () => {
    startAudioRecording()
  }

  // 녹음 중지
  const stopRecording = () => {
    stopAudioRecording()
  }

  // TTS 재생
  const playQuestion = () => {
    setIsPlaying(true)
    // Web Speech API를 사용한 TTS 구현
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(questions[currentQuestion])
      utterance.onend = () => setIsPlaying(false)
      speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setIsPlaying(false), 3000)
    }
  }

  // 질문 이동
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowFollowup(false)
      setFollowupQuestion('')
      setFollowupAnswer('')
    } else {
      // 마지막 질문이면 면접 완료
      completeInterview()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setShowFollowup(false)
      setFollowupQuestion('')
      setFollowupAnswer('')
    }
  }

  // 면접 완료
  const completeInterview = async () => {
    try {
      // 추가 질문이 있으면 답변에 포함
      const finalAnswers = [...answers]
      if (followupQuestion && followupAnswer) {
        finalAnswers.push({
          questionIndex: currentQuestion,
          question: followupQuestion,
          answer: followupAnswer,
          timestamp: new Date().toISOString(),
          isFollowup: true
        })
      }

      // 답변이 없으면 경고
      if (finalAnswers.length === 0) {
        alert('답변을 하나 이상 입력해주세요.')
        return
      }

      console.log('전송할 답변 데이터:', finalAnswers)

      // 백엔드에 답변 평가 요청
      console.log('=== 면접 평가 요청 시작 ===')
      console.log('사용자 ID:', userId)
      console.log('답변 개수:', finalAnswers.length)
      console.log('질문 개수:', questions.length)
      console.log('자기소개서 기반 여부:', isResumeBased)
      
      const evaluationResponse = await fetch('http://localhost:8000/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: finalAnswers,
          questions: questions,
          user_id: userId,
          isResumeBased: isResumeBased
        })
      })
      
      console.log('평가 응답 상태:', evaluationResponse.status)
      
      if (!evaluationResponse.ok) {
        const errorText = await evaluationResponse.text()
        console.error('평가 API 에러 응답:', errorText)
        throw new Error(`HTTP error! status: ${evaluationResponse.status}, message: ${errorText}`)
      }
      
      const evaluationData = await evaluationResponse.json()
      console.log('=== 평가 결과 수신 완료 ===')
      console.log('평가 데이터:', evaluationData)
      console.log('성공 여부:', evaluationData.success)
      console.log('Firestore ID:', evaluationData.data?.firestore_id)

      // Firebase ID가 있으면 해당 ID로 Results 페이지로 이동, 없으면 state로 전달
      const firestoreId = evaluationData.data?.firestore_id
      const completedTime = new Date().toISOString()
      
      if (firestoreId) {
        // Firebase ID가 있으면 직접 링크로 이동
        navigate(`/results/${firestoreId}`)
      } else {
        // Firebase ID가 없으면 state로 전달
        navigate('/results', { 
          state: { 
            answers: finalAnswers,
            questions: questions,
            completedAt: completedTime,
            evaluation: evaluationData,
            isResumeBased: isResumeBased
          }
        })
      }

      // 면접 기록을 localStorage에도 저장 (백업용)
      const interviewRecord = {
        id: firestoreId || Date.now(),
        answers: finalAnswers,
        questions: questions,
        completedAt: completedTime,
        evaluation: evaluationData,
        isResumeBased: isResumeBased,
        overallScore: evaluationData.data?.overallScore || 0
      }
      
      try {
        const existingInterviews = JSON.parse(localStorage.getItem('interviewHistory') || '[]')
        existingInterviews.unshift(interviewRecord) // 최신 기록을 맨 위에 추가
        localStorage.setItem('interviewHistory', JSON.stringify(existingInterviews))
        console.log('면접 기록 저장 완료')
      } catch (error) {
        console.error('면접 기록 저장 실패:', error)
      }
    } catch (error) {
      console.error('=== 평가 요청 실패 ===')
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
      
      // 오류 시에도 결과 페이지로 이동 (기본 데이터 포함)
      const errorTime = new Date().toISOString()
      const errorData = {
        answers: answers,
        questions: questions,
        completedAt: errorTime,
        isResumeBased: isResumeBased,
        error: error.message,
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
              improvements: ["평가 시스템 점검 중입니다"],
              nextSteps: ["다시 시도해보세요"]
            }
          }
        }
      }
      
      console.log('에러 데이터로 Results 페이지 이동:', errorData)
      navigate('/results', { state: errorData })
    }
  }

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">면접 질문을 생성하고 있습니다</h3>
          <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎥 AI 면접 시뮬레이션</h1>
          <p className="text-lg text-gray-600 mb-4">
            {isResumeBased ? '자기소개서 기반 맞춤형 면접' : '기본 면접 질문'} • 실시간 평가
          </p>
          {isResumeBased && (
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4 mr-2" />
              자기소개서 기반 질문
            </div>
          )}
        </div>

        {/* 웹캠 컨트롤 */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📹 면접자 촬영</h3>
              <button
                onClick={isCameraOn ? stopCamera : initializeCamera}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCameraOn 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isCameraOn ? (
                  <>
                    <CameraOff className="w-5 h-5 mr-2" />
                    카메라 끄기
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    카메라 켜기
                  </>
                )}
              </button>
            </div>
            
            {/* 웹캠 영역 */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">카메라가 꺼져있습니다</p>
                  </div>
                </div>
              )}
            </div>
            
            {cameraPermission === 'denied' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">카메라 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.</span>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* 웹캠 미리보기 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">웹캠 미리보기</h3>
              <div className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                {isCameraOn && cameraPermission === 'granted' ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                    {cameraPermission === 'denied' ? (
                      <span>카메라 권한이 거부되었습니다.</span>
                    ) : (
                      <span>카메라를 켜주세요.</span>
                    )}
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={toggleCamera}
                    className={`p-2 rounded-full shadow-md ${
                      isCameraOn ? 'bg-red-500' : 'bg-gray-600'
                    } text-white`}
                  >
                    {isCameraOn ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                질문 {currentQuestion + 1}
              </h2>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                {questions[currentQuestion]}
              </p>
              
              {/* TTS 재생 버튼 */}
              <button
                onClick={playQuestion}
                disabled={isPlaying}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    재생 중...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    질문 듣기
                  </>
                )}
              </button>
            </div>

            {/* 녹음 영역 */}
            <div className="text-center">
              <div className="mb-6">
                <button
                  onClick={toggleRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>
              
              <p className="text-lg text-gray-700 mb-4">
                {isRecording ? '🎤 녹음 중... 답변을 시작하세요' : '버튼을 눌러 답변을 녹음하세요'}
              </p>
              
              {isRecording && (
                <div className="flex items-center justify-center space-x-2 text-red-500 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-lg font-medium">REC</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 추가 질문 */}
        {showFollowup && followupQuestion && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-semibold text-yellow-800">추가 질문</h3>
              </div>
              <p className="text-yellow-700 mb-4 text-lg">{followupQuestion}</p>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setShowFollowup(false)
                    setFollowupQuestion('')
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  건너뛰기
                </button>
                <button
                  onClick={() => {
                    // 추가 질문에 대한 답변 입력
                    const followupUserAnswer = prompt(`추가 질문: ${followupQuestion}\n\n답변을 텍스트로 입력해주세요:`)
                    if (followupUserAnswer && followupUserAnswer.trim()) {
                      setFollowupAnswer(followupUserAnswer.trim())
                      setShowFollowup(false)
                    }
                  }}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  답변하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 네비게이션 */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              이전 질문
            </button>
            
            <button
              onClick={nextQuestion}
              disabled={currentQuestion === questions.length - 1}
              className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 질문
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* 완료 버튼 */}
        {currentQuestion === questions.length - 1 && (
          <div className="max-w-2xl mx-auto text-center">
            <button 
              onClick={completeInterview}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-12 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🎯 면접 완료 및 결과 보기
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default InterviewSimulation