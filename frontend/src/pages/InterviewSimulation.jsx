import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mic, MicOff, Play, Pause, Camera, CameraOff, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

const InterviewSimulation = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  
  // 통합된 상태 관리
  const [state, setState] = useState({
    currentQuestion: 0,
    isRecording: false,
    isPlaying: false,
    answers: [],
    questions: [],
    isResumeBased: false,
    loading: true,
    resumeContent: '',
    questionsGenerated: false,
    
    // 미디어 관련
    isCameraOn: false,
    cameraPermission: null,
    isProcessingSTT: false,
    
    // 모달 관련
    showManualInput: false,
    manualInputTitle: '',
    manualInputContent: '',
    manualInputValue: '',
    
    // STT 관련
    sttResult: null,
    pendingAnswer: null,
    
    // 면접 완료 관련
    isCompletingInterview: false,
    
    // 자기소개서 관련
    hasResume: null,  // null: 확인 중, true: 있음, false: 없음
    showResumeRequiredModal: false
  })

  const [userId, setUserId] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const videoChunksRef = useRef([])

  // 상태 업데이트 헬퍼
  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  // 사용자 ID 설정
  useEffect(() => {
    if (!authLoading && user?.uid) {
      setUserId(user.uid)
    }
  }, [authLoading, user])

  // 현재 질문 텍스트를 가져오는 함수
  const getCurrentQuestionText = () => {
    return state.currentQuestion === 0 
      ? "안녕하세요! 먼저 간단한 인사와 함께 1분 내외로 자기소개를 부탁드립니다."
      : state.questions[state.currentQuestion]
  }

  // 컴포넌트 언마운트 시 메모리 정리
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && state.isRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        console.log('컴포넌트 언마운트 시 미디어 트랙 정리')
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // 면접 초기화
  useEffect(() => {
    if (!authLoading && userId && !state.questionsGenerated) {
      initializeInterview()
    }
  }, [authLoading, userId])

  const initializeInterview = async () => {
    try {
      await generateQuestions()
      await initializeCamera()
    } catch (error) {
      console.error('면접 초기화 에러:', error)
    }
  }

  // 웹캠 초기화 (비디오+오디오 스트림)
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true  // 오디오도 함께 캡처
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        updateState({ isCameraOn: true, cameraPermission: 'granted' })
      }
    } catch (error) {
      console.error('웹캠 접근 실패:', error)
      updateState({ cameraPermission: 'denied', isCameraOn: false })
    }
  }

  const toggleCamera = () => {
    if (state.isCameraOn) {
      stopCamera()
    } else {
      initializeCamera()
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      updateState({ isCameraOn: false })
    }
  }

  // 자기소개서 확인
  const checkResumeExists = useCallback(async () => {
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore')
      const { db } = await import('../lib/firebase')
      
      const resumesQuery = query(
        collection(db, 'users', userId, 'resumes'),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const resumesSnapshot = await getDocs(resumesQuery)
      
      if (!resumesSnapshot.empty) {
        const latestResume = resumesSnapshot.docs[0].data()
        const resumeContent = latestResume.analysis || latestResume.extractedText || ''
        updateState({ 
          hasResume: true, 
          resumeContent,
          showResumeRequiredModal: false 
        })
        return resumeContent
      } else {
        updateState({ 
          hasResume: false, 
          showResumeRequiredModal: true 
        })
        return ''
      }
    } catch (e) {
      console.error('Firebase 데이터 가져오기 실패:', e)
      updateState({ 
        hasResume: false, 
        showResumeRequiredModal: true 
      })
      return ''
    }
  }, [userId])

  // 자기소개서 분석 페이지로 이동
  const goToResumeUpload = () => {
    navigate('/resume-upload')
  }

  // 자기소개서 모달 닫기 (기본 질문으로 진행)
  const closeResumeModal = () => {
    updateState({ showResumeRequiredModal: false })
    // 기본 질문으로 진행
    generateQuestionsWithBasic()
  }

  // 기본 질문으로 면접 진행
  const generateQuestionsWithBasic = useCallback(async () => {
    try {
      updateState({ loading: true, questionsGenerated: true })
      
      // 기본 질문 사용
      const basicQuestions = [
        "자기소개를 해주세요",
        "지원하신 직무에 대한 동기를 말씀해주세요",
        "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요",
        "팀워크를 발휘했던 경험을 말씀해주세요",
        "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요"
      ]
      
      updateState({ 
        questions: basicQuestions,
        isResumeBased: false,
        loading: false
      })
    } catch (error) {
      console.error('기본 질문 생성 에러:', error)
      updateState({ loading: false })
    }
  }, [])

  // 질문 생성 (간소화)
  const generateQuestions = useCallback(async () => {
    if (state.questions.length > 0 || window.questionGenerationInProgress) return
    
    try {
      updateState({ loading: true, questionsGenerated: true })
      window.questionGenerationInProgress = true
      
      // 자기소개서 확인
      const resumeContent = await checkResumeExists()
      
      // 자기소개서가 없으면 질문 생성 중단
      if (!resumeContent) {
        updateState({ loading: false })
        window.questionGenerationInProgress = false
        return
      }

      // 백엔드에 질문 생성 요청
      const response = await fetch('http://localhost:8000/api/interview/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_count: 5,
          user_id: userId,
          resume_content: resumeContent
        })
      })

      const data = await response.json()
      
      if (data.success) {
        updateState({ 
          questions: data.data.questions,
          isResumeBased: data.data.is_resume_based 
        })
      } else {
        throw new Error(data.detail || '질문 생성 실패')
      }
    } catch (error) {
      console.error('질문 생성 에러:', error)
      // 기본 질문으로 폴백
      updateState({
        questions: [
          "자기소개를 해주세요.",
          "지원하신 직무에 대한 동기를 말씀해주세요.",
          "가장 성공적이었던 프로젝트 경험에 대해 설명해주세요.",
          "팀워크를 발휘했던 경험을 말씀해주세요.",
          "어려운 상황을 어떻게 극복하셨는지 예시를 들어 설명해주세요."
        ],
        isResumeBased: false
      })
    } finally {
      updateState({ loading: false })
      window.questionGenerationInProgress = false
    }
  }, [userId, state.questions.length, state.questionsGenerated])

  // 추가 질문 생성 (간소화)
  const generateFollowupQuestion = async (originalQuestion, answer) => {
    try {
      const response = await fetch('http://localhost:8000/api/interview/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_question: originalQuestion,
          answer: answer,
          resume_content: state.resumeContent
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const followup = data.data.followup_question
        if (followup && !followup.includes('추가 질문이 필요하지 않습니다')) {
          // 간단한 알림으로 처리
          console.log('추가 질문 생성됨:', followup)
        }
      }
    } catch (error) {
      console.error('추가 질문 생성 에러:', error)
    }
  }

  // 음성 녹음 (간소화)
  const toggleRecording = async () => {
    if (state.isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const startRecording = async () => {
    try {
      let stream
      
      if (state.isCameraOn && streamRef.current) {
        // 카메라가 켜져있으면 비디오+오디오 녹화
        stream = streamRef.current
        videoChunksRef.current = []

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus'
        })

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
          processRecording(videoBlob)
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
      } else {
        // 카메라가 꺼져있으면 오디오만 녹화
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          convertAudioToText(audioBlob)
        }

        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
      }

      updateState({ isRecording: true })
    } catch (error) {
      console.error('녹화 시작 실패:', error)
      alert('마이크 권한이 필요합니다.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
      // 스트림 트랙은 정리하지 않음 (카메라가 계속 켜져있을 수 있음)
      updateState({ isRecording: false })
    }
  }

  // 비디오 녹화 처리 (비디오+오디오)
  const processRecording = async (videoBlob) => {
    updateState({ isProcessingSTT: true })
    
    try {
      // 비디오 파일을 백엔드로 전송
      const formData = new FormData()
      formData.append('video_file', videoBlob, 'recording.webm')
      formData.append('user_id', userId)
      
      const response = await fetch('http://localhost:8000/api/interview/video-to-text', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        const { text, quality_score, needs_review, video_url } = result.data
        const currentQuestionText = getCurrentQuestionText()
        
        const newAnswer = {
          questionIndex: state.currentQuestion,
          question: currentQuestionText,
          answer: text.trim(),
          timestamp: new Date().toISOString(),
          hasVideo: true,
          hasAudio: true,
          videoURL: video_url,
          audioURL: result.data.audio_url
        }
        
        if (needs_review) {
          // 품질이 낮으면 수정 모달 표시
          console.log('비디오 STT 품질이 낮아서 수정 모달 표시')
          showManualInputModal(
            '음성 인식 품질 확인 필요',
            `음성 인식 품질이 낮아 보입니다 (점수: ${(quality_score * 100).toFixed(0)}%).\n\n인식된 텍스트를 확인하고 수정해주세요:\n\n질문: ${currentQuestionText}`,
            text.trim(),
            (finalAnswer) => {
              console.log('비디오 STT 수정 모달 콜백 실행:', finalAnswer)
              updateState({ 
                sttResult: null,
                pendingAnswer: null
              })
              proceedAfterAnswer({ ...newAnswer, answer: finalAnswer })
            }
          )
        } else {
          // 품질이 좋으면 자동 진행
          proceedAfterAnswer(newAnswer)
        }
      }
    } catch (error) {
      console.error('비디오 STT API 호출 에러:', error)
      console.log('비디오 STT 실패로 수동 입력 모달 표시')
      showManualInputModal(
        '음성 인식에 실패했습니다',
        `질문: ${getCurrentQuestionText()}\n\n답변을 텍스트로 입력해주세요:`,
        '',
        (userAnswer) => {
          console.log('비디오 STT 실패 모달 콜백 실행:', userAnswer)
          const newAnswer = {
            questionIndex: state.currentQuestion,
            question: getCurrentQuestionText(),
            answer: userAnswer,
            timestamp: new Date().toISOString(),
            hasVideo: true,
            hasAudio: true
          }
          proceedAfterAnswer(newAnswer)
        }
      )
    } finally {
      updateState({ isProcessingSTT: false })
    }
  }

  // STT 처리 (간소화) - 오디오만 처리하는 경우
  const convertAudioToText = async (audioBlob) => {
    updateState({ isProcessingSTT: true })
    
    try {
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.wav')
      formData.append('user_id', userId)
      
      const response = await fetch('http://localhost:8000/api/interview/speech-to-text', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        const { text, quality_score, needs_review } = result.data
        const currentQuestionText = getCurrentQuestionText()
        
        const newAnswer = {
          questionIndex: state.currentQuestion,
          question: currentQuestionText,
          answer: text.trim(),
          timestamp: new Date().toISOString(),
          hasAudio: true,
          audioURL: result.data.audio_url
        }
        
        if (needs_review) {
          // 품질이 낮으면 수정 모달 표시
          console.log('STT 품질이 낮아서 수정 모달 표시')
          showManualInputModal(
            '음성 인식 품질 확인 필요',
            `음성 인식 품질이 낮아 보입니다 (점수: ${(quality_score * 100).toFixed(0)}%).\n\n인식된 텍스트를 확인하고 수정해주세요:\n\n질문: ${currentQuestionText}`,
            text.trim(),
            (finalAnswer) => {
              console.log('STT 수정 모달 콜백 실행:', finalAnswer)
              updateState({ 
                sttResult: null,
                pendingAnswer: null
              })
              proceedAfterAnswer({ ...newAnswer, answer: finalAnswer })
            }
          )
        } else {
          // 품질이 좋으면 자동 진행
          proceedAfterAnswer(newAnswer)
        }
      }
    } catch (error) {
      console.error('STT API 호출 에러:', error)
      console.log('STT 실패로 수동 입력 모달 표시')
      showManualInputModal(
        '음성 인식에 실패했습니다',
        `질문: ${getCurrentQuestionText()}\n\n답변을 텍스트로 입력해주세요:`,
        '',
        (userAnswer) => {
          console.log('STT 실패 모달 콜백 실행:', userAnswer)
          const newAnswer = {
            questionIndex: state.currentQuestion,
            question: getCurrentQuestionText(),
            answer: userAnswer,
            timestamp: new Date().toISOString(),
            hasAudio: true
          }
          proceedAfterAnswer(newAnswer)
        }
      )
    } finally {
      updateState({ isProcessingSTT: false })
    }
  }

  // 모달 관리 (간소화)
  const showManualInputModal = (title, content, defaultValue, callback) => {
    console.log('수동 입력 모달 표시:', title, '기본값:', defaultValue)
    updateState({
      showManualInput: true,
      manualInputTitle: title,
      manualInputContent: content,
      manualInputValue: defaultValue || '',
      sttResult: defaultValue
    })
    window.manualInputCallback = callback
    console.log('콜백 설정됨:', !!callback)
  }

  const handleManualInputSubmit = () => {
    console.log('모달 제출 버튼 클릭됨:', state.manualInputValue.trim())
    if (state.manualInputValue.trim() && window.manualInputCallback) {
      const callback = window.manualInputCallback
      const answerText = state.manualInputValue.trim()
      console.log('콜백 실행 전 - 현재 질문:', state.currentQuestion)
      
      // 모달을 먼저 닫기
      updateState({
        showManualInput: false,
        manualInputValue: '',
        sttResult: null,
        pendingAnswer: null
      })
      window.manualInputCallback = null
      
      // 상태 업데이트가 완료된 후 콜백 실행
      setTimeout(() => {
        callback(answerText)
        console.log('콜백 실행 완료')
      }, 100)
    } else {
      console.log('모달 제출 실패 - 값:', state.manualInputValue, '콜백:', !!window.manualInputCallback)
    }
  }

  const handleManualInputCancel = () => {
    updateState({
      showManualInput: false,
      manualInputValue: '',
      sttResult: null,
      pendingAnswer: null
    })
    window.manualInputCallback = null
  }

  // TTS 재생
  const playQuestion = () => {
    updateState({ isPlaying: true })
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(getCurrentQuestionText())
      utterance.onend = () => updateState({ isPlaying: false })
      speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => updateState({ isPlaying: false }), 3000)
    }
  }

  // 질문 이동
  const nextQuestion = () => {
    console.log('nextQuestion 호출됨 - 현재 질문:', state.currentQuestion, '총 질문 수:', state.questions.length)
    if (state.currentQuestion < state.questions.length - 1) {
      console.log('다음 질문으로 이동:', state.currentQuestion + 1)
      updateState({ currentQuestion: state.currentQuestion + 1 })
    } else {
      console.log('마지막 질문이므로 면접 완료')
      completeInterview()
    }
  }

  // 답변 저장 후 다음 단계로 진행
  const proceedAfterAnswer = (newAnswer) => {
    console.log('답변 저장 후 진행 - 현재 질문:', state.currentQuestion, '총 질문 수:', state.questions.length)
    console.log('새로운 답변:', newAnswer)
    
    // 답변을 상태에 추가
    const updatedAnswers = [...state.answers, newAnswer]
    updateState({ answers: updatedAnswers })
    
    // 마지막 질문인지 확인
    if (state.currentQuestion >= state.questions.length - 1) {
      console.log('마지막 질문 답변 완료, 면접 완료 처리')
      console.log('최종 답변 목록:', updatedAnswers)
      // 상태 업데이트가 완료된 후 면접 완료 처리
      setTimeout(() => {
        completeInterviewWithAnswers(updatedAnswers)
      }, 100)
    } else {
      console.log('다음 질문으로 이동')
      updateState({ currentQuestion: state.currentQuestion + 1 })
    }
  }

  // 답변 데이터를 직접 받아서 면접 완료 처리
  const completeInterviewWithAnswers = async (answers) => {
    try {
      // 분석 중 모달 표시
      updateState({ isCompletingInterview: true })
      
      const validAnswers = answers.filter(answer => answer.answer && answer.answer.trim().length > 0)
      console.log('면접 완료 처리 - 유효한 답변 수:', validAnswers.length)
      console.log('답변 목록:', validAnswers)
      
      if (validAnswers.length === 0) {
        validAnswers.push({
          questionIndex: 0,
          question: getCurrentQuestionText(),
          answer: "전부 미응답 시 테스트용 답변입니다.",
          timestamp: new Date().toISOString(),
          isFollowup: false
        })
      }

      const evaluationResponse = await fetch('http://localhost:8000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: validAnswers,
          questions: state.questions,
          user_id: userId,
          isResumeBased: state.isResumeBased
        })
      })

      const evaluationData = await evaluationResponse.json()
      const firestoreId = evaluationData.data?.firestore_id
      
      // 분석 완료 후 모달 닫기
      updateState({ isCompletingInterview: false })
      
      if (firestoreId) {
        navigate(`/results/${firestoreId}`)
      } else {
        navigate('/results', { 
          state: { 
            answers: validAnswers,
            questions: state.questions,
            completedAt: new Date().toISOString(),
            evaluation: evaluationData,
            isResumeBased: state.isResumeBased
          }
        })
      }
    } catch (error) {
      console.error('면접 완료 에러:', error)
      updateState({ isCompletingInterview: false })
      navigate('/results', { 
        state: { 
          answers: answers,
          questions: state.questions,
          error: error.message
        }
      })
    }
  }

  const prevQuestion = () => {
    if (state.currentQuestion > 0) {
      updateState({ currentQuestion: state.currentQuestion - 1 })
    }
  }

  // 면접 완료 (간소화)
  const completeInterview = async () => {
    try {
      // 분석 중 모달 표시
      updateState({ isCompletingInterview: true })
      
      const validAnswers = state.answers.filter(answer => answer.answer && answer.answer.trim().length > 0)
      
      if (validAnswers.length === 0) {
        validAnswers.push({
          questionIndex: 0,
          question: getCurrentQuestionText(),
          answer: "전부 미응답 시 테스트용 답변입니다.",
          timestamp: new Date().toISOString(),
          isFollowup: false
        })
      }

      const evaluationResponse = await fetch('http://localhost:8000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: validAnswers,
          questions: state.questions,
          user_id: userId,
          isResumeBased: state.isResumeBased
        })
      })

      const evaluationData = await evaluationResponse.json()
      const firestoreId = evaluationData.data?.firestore_id
      
      // 분석 완료 후 모달 닫기
      updateState({ isCompletingInterview: false })
      
      if (firestoreId) {
        navigate(`/results/${firestoreId}`)
      } else {
        navigate('/results', { 
          state: { 
            answers: validAnswers,
            questions: state.questions,
            completedAt: new Date().toISOString(),
            evaluation: evaluationData,
            isResumeBased: state.isResumeBased
          }
        })
      }
    } catch (error) {
      console.error('면접 완료 에러:', error)
      updateState({ isCompletingInterview: false })
      navigate('/results', { 
        state: { 
          answers: state.answers,
          questions: state.questions,
          error: error.message
        }
      })
    }
  }

  // 로딩 화면
  if (authLoading || state.loading || state.hasResume === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {authLoading ? '로그인 상태를 확인하고 있습니다' : 
             state.hasResume === null ? '자기소개서를 확인하고 있습니다' :
             '면접 질문을 생성하고 있습니다'}
          </h3>
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
            {state.isResumeBased ? '자기소개서 기반 맞춤형 면접' : '기본 면접 질문'} • 실시간 평가
          </p>
          {state.isResumeBased && (
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
                onClick={toggleCamera}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  state.isCameraOn 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {state.isCameraOn ? (
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
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
              {state.isCameraOn ? (
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
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">카메라가 꺼져있습니다</p>
                  </div>
                </div>
              )}
            </div>
            
            {state.cameraPermission === 'denied' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-700">
                  <span className="text-sm">카메라 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                질문 {state.currentQuestion + 1}
              </h2>
              <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                {getCurrentQuestionText()}
              </p>
              
              <button
                onClick={playQuestion}
                disabled={state.isPlaying}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {state.isPlaying ? (
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
                  disabled={state.isProcessingSTT}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg ${
                    state.isRecording
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : state.isCameraOn 
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                  } ${state.isProcessingSTT ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {state.isRecording ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>
              
              <p className="text-lg text-gray-700 mb-4">
                {state.isRecording ? 
                  (state.isCameraOn ? '🎥 비디오 녹화 중... 답변을 시작하세요' : '🎤 녹음 중... 답변을 시작하세요') : 
                 state.isProcessingSTT ? '🔄 음성을 텍스트로 변환 중...' : 
                 state.isCameraOn ? '🎥 비디오+오디오 녹화 버튼을 눌러주세요' :
                 '🎤 음성 녹음 버튼을 눌러주세요'}
              </p>
              
              {state.isRecording && (
                <div className="flex items-center justify-center space-x-2 text-red-500 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-lg font-medium">
                    {state.isCameraOn ? 'VIDEO REC' : 'AUDIO REC'}
                  </span>
                </div>
              )}
              
              {state.isProcessingSTT && (
                <div className="flex items-center justify-center space-x-2 text-blue-500 mb-4">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-lg font-medium">음성 인식 중...</span>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={state.currentQuestion === 0}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              이전 질문
            </button>
            
            <button
              onClick={nextQuestion}
              disabled={state.currentQuestion === state.questions.length - 1}
              className="flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음 질문
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>

        {/* 완료 버튼 */}
        {state.currentQuestion === state.questions.length - 1 && (
          <div className="max-w-2xl mx-auto text-center">
            <button 
              onClick={completeInterview}
              disabled={state.isCompletingInterview}
              className={`bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl px-12 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                state.isCompletingInterview ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {state.isCompletingInterview ? '🔄 분석 중...' : '🎯 면접 완료 및 결과 보기'}
            </button>
          </div>
        )}
      </div>

      {/* 수동 입력 모달 */}
      {state.showManualInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{state.manualInputTitle}</h3>
              <p className="text-gray-600 whitespace-pre-line">{state.manualInputContent}</p>
              {state.sttResult && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    💡 인식된 텍스트를 확인하고 필요시 수정해주세요
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <textarea
                value={state.manualInputValue}
                onChange={(e) => updateState({ manualInputValue: e.target.value })}
                placeholder="답변을 입력해주세요..."
                className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:border-transparent ${
                  state.sttResult 
                    ? 'border-green-300 focus:ring-green-500 bg-green-25' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                rows={4}
                autoFocus
              />
              {state.sttResult && (
                <p className="mt-2 text-xs text-green-600">
                  ✨ 음성 인식 결과입니다. 텍스트를 자유롭게 수정할 수 있습니다.
                </p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleManualInputCancel}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleManualInputSubmit}
                disabled={!state.manualInputValue.trim()}
                className={`px-6 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  state.sttResult 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {state.sttResult ? '수정 완료' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자기소개서 필요 모달 */}
      {state.showResumeRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">자기소개서 분석이 필요합니다</h3>
              <p className="text-gray-600 mb-6">
                맞춤형 면접 질문을 생성하기 위해서는<br />
                먼저 자기소개서를 분석해주세요.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={goToResumeUpload}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                📄 자기소개서 분석하러 가기
              </button>
              <button
                onClick={closeResumeModal}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 면접 완료 분석 중 모달 */}
      {state.isCompletingInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl text-center">
            <div className="mb-6">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">면접 분석 중</h3>
              <p className="text-gray-600 mb-4">
                AI가 면접 답변을 분석하고 있습니다.<br />
                잠시만 기다려주세요...
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>답변 내용 분석</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span>점수 계산</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <span>피드백 생성</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewSimulation