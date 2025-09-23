import React, { useState, useEffect, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { AlertCircle, CheckCircle, Loader, Eye, Hand, User, Activity } from 'lucide-react'

const PoseAnalysis = ({ onAnalysisResult, isActive = false }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState({
    headMovement: 0,
    handGestures: 0,
    torsoMovement: 0,
    legMovement: 0,
    feedback: [],
    lastUpdate: null
  })
  const [error, setError] = useState('')
  const [webcamError, setWebcamError] = useState('')
  const analysisIntervalRef = useRef(null)
  const webcamRef = useRef(null)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // 웹캠 에러 처리
  const handleWebcamError = useCallback((error) => {
    console.error('웹캠 에러:', error)
    setWebcamError('웹캠에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.')
  }, [])

  // 웹캠 사용자 미디어 요청
  const requestWebcamPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480, 
          facingMode: "user" 
        } 
      })
      stream.getTracks().forEach(track => track.stop()) // 테스트 후 정리
      setWebcamError('')
      return true
    } catch (error) {
      handleWebcamError(error)
      return false
    }
  }, [handleWebcamError])

  // 실시간 분석 시작
  const startRealTimeAnalysis = useCallback(() => {
    if (!isActive || analysisIntervalRef.current) return

    analysisIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current) return

      try {
        setIsAnalyzing(true)
        setError('')

        // 웹캠에서 프레임 캡처
        const frame = webcamRef.current.getScreenshot()
        if (!frame) {
          console.warn('프레임 캡처 실패')
          return
        }

        // 백엔드로 프레임 전송하여 분석
        const response = await fetch(`${API_BASE_URL}/api/behavior/analyze-frame`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ frame_data: frame })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.data) {
          const data = result.data
          const newAnalysisData = {
            headMovement: analysisData.headMovement + (data.counts['고개 과도 회전'] || 0),
            handGestures: analysisData.handGestures + (data.counts['과도한 손짓'] || 0),
            torsoMovement: analysisData.torsoMovement + (data.counts['상반신 흔들림'] || 0),
            legMovement: analysisData.legMovement + (data.counts['다리 움직임'] || 0),
            feedback: data.feedback || [],
            lastUpdate: new Date().toISOString()
          }

          setAnalysisData(newAnalysisData)
          
          // 부모 컴포넌트에 결과 전달
          if (onAnalysisResult) {
            onAnalysisResult(newAnalysisData)
          }
        } else {
          console.warn('분석 결과가 없습니다:', result.data?.error)
        }
      } catch (err) {
        console.error('실시간 분석 오류:', err)
        setError(`분석 오류: ${err.message}`)
      } finally {
        setIsAnalyzing(false)
      }
    }, 2000) // 2초마다 분석
  }, [isActive, analysisData, onAnalysisResult])

  // 실시간 분석 중지
  const stopRealTimeAnalysis = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
      analysisIntervalRef.current = null
    }
  }, [])

  // 분석 상태 초기화
  const resetAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/behavior/reset-analysis-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        setAnalysisData({
          headMovement: 0,
          handGestures: 0,
          torsoMovement: 0,
          legMovement: 0,
          feedback: [],
          lastUpdate: null
        })
        setError('')
      }
    } catch (err) {
      console.error('상태 초기화 오류:', err)
    }
  }, [])

  // 컴포넌트 마운트/언마운트 시 분석 시작/중지
  useEffect(() => {
    if (isActive) {
      // 웹캠 권한 요청
      requestWebcamPermission().then(hasPermission => {
        if (hasPermission) {
          // 백엔드 분석 상태 초기화
          fetch(`${API_BASE_URL}/api/behavior/reset-analysis-state`, { method: 'POST' })
            .then(res => res.json())
            .then(data => console.log('분석 상태 초기화:', data))
            .catch(error => console.error('분석 상태 초기화 실패:', error))

          startRealTimeAnalysis()
        }
      })
    } else {
      stopRealTimeAnalysis()
    }

    return () => {
      stopRealTimeAnalysis()
    }
  }, [isActive, startRealTimeAnalysis, stopRealTimeAnalysis, requestWebcamPermission, API_BASE_URL])

  // 분석 결과 표시 컴포넌트
  const AnalysisResult = ({ icon: Icon, label, count, color, description }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <div className="text-lg font-bold text-gray-900">{count}회</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* 분석 상태 표시 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">실시간 행동 분석</h3>
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-sm">분석 중...</span>
            </div>
          )}
          <button
            onClick={resetAnalysis}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 웹캠 오류 표시 */}
      {webcamError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center mb-4">
          <AlertCircle className="mr-2 h-4 w-4" />
          {webcamError}
        </div>
      )}

      {/* 분석 오류 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center mb-4">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}

      {/* 분석 결과 */}
      <div className="space-y-3">
        <AnalysisResult
          icon={Eye}
          label="고개 과도 회전"
          count={analysisData.headMovement}
          color="bg-red-500"
          description="면접관과의 시선 교환"
        />
        <AnalysisResult
          icon={Hand}
          label="과도한 손짓"
          count={analysisData.handGestures}
          color="bg-yellow-500"
          description="어깨 위로 올라간 손동작"
        />
        <AnalysisResult
          icon={User}
          label="상반신 흔들림"
          count={analysisData.torsoMovement}
          color="bg-blue-500"
          description="어깨와 엉덩이 중심점 변화"
        />
        <AnalysisResult
          icon={Activity}
          label="다리 움직임"
          count={analysisData.legMovement}
          color="bg-green-500"
          description="하반신 키포인트 움직임"
        />
      </div>

      {/* 피드백 표시 */}
      {analysisData.feedback.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">실시간 피드백</h4>
          <div className="space-y-1">
            {analysisData.feedback.map((feedback, index) => (
              <div key={index} className="text-sm text-blue-800 flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 마지막 업데이트 시간 */}
      {analysisData.lastUpdate && (
        <div className="text-xs text-gray-500 text-center">
          마지막 업데이트: {new Date(analysisData.lastUpdate).toLocaleTimeString()}
        </div>
      )}

      {/* 웹캠 참조 (숨김) */}
      <div style={{ display: 'none' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: "user"
          }}
        />
      </div>
    </div>
  )
}

export default PoseAnalysis
