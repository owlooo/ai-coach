import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, FileBarChart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ResumeUpload = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [fileInfo, setFileInfo] = useState(null)

  // 사용자 ID 생성 또는 가져오기 (Firebase Auth UID만 사용)
  const getUserId = () => {
    // Firebase Authentication 사용자가 있으면 해당 사용자 ID 사용
    if (user && user.uid) {
      return user.uid
    }
    
    // 로그인하지 않은 사용자는 에러 처리
    throw new Error('로그인이 필요합니다. 먼저 로그인해주세요.')
  }

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      await analyzeResume(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  })

  const analyzeResume = async (file) => {
    setLoading(true)
    try {
      // FormData 생성
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', getUserId())
      
      // 백엔드 API 호출
      const response = await fetch('http://localhost:8000/api/resume/analyze', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('분석 요청 실패')
      }
      
      const result = await response.json()
      
      if (result.success) {
        // AI 분석 결과를 마크다운 형식으로 포맷팅
        const analysisData = result.data
        const fileInfo = analysisData.file_info || {}
        const firestoreId = analysisData.firestore_id
        
        // 분석 완료 시간 저장
        const analyzedAt = new Date().toISOString()
        
        // 분석 데이터 저장 (보고서 페이지용)
        setAnalysisData(analysisData)
        setFileInfo({...fileInfo, original_name: file.name, size: file.size, firestore_id: firestoreId, analyzedAt: analyzedAt})

        // 자기소개서 분석 기록을 localStorage에 저장
        const resumeRecord = {
          id: firestoreId || Date.now(),
          fileName: file.name,
          fileSize: file.size,
          analyzedAt: analyzedAt,
          analysis: analysisData.analysis,
          fileInfo: {...fileInfo, original_name: file.name, size: file.size, firestore_id: firestoreId, analyzedAt: analyzedAt}
        }
        
        try {
          const existingResumes = JSON.parse(localStorage.getItem('resumeHistory') || '[]')
          existingResumes.unshift(resumeRecord) // 최신 기록을 맨 위에 추가
          localStorage.setItem('resumeHistory', JSON.stringify(existingResumes))
          console.log('자기소개서 분석 기록 저장 완료')
        } catch (error) {
          console.error('자기소개서 분석 기록 저장 실패:', error)
        }
        
        // 분석 완료 상태 설정
        setAnalysis('completed')
      } else {
        throw new Error(result.detail || '분석 실패')
      }
      
    } catch (error) {
      console.error('분석 에러:', error)
      // 오류 시 상태 설정
      setAnalysis('error')
      setAnalysisData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📄 자기소개서 분석
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            PDF 파일을 업로드하여 AI 분석을 받아보세요
          </p>
      </div>

      {/* 파일 업로드 영역 */}
        <div className="max-w-4xl mx-auto mb-12">
        <div
          {...getRootProps()}
            className={`bg-white rounded-2xl shadow-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 group ${
            isDragActive
                ? 'border-blue-500 bg-blue-50 shadow-2xl'
                : 'border-gray-300 hover:border-blue-400 hover:shadow-2xl'
          }`}
        >
          <input {...getInputProps()} />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
              isDragActive 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 scale-110' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 group-hover:scale-110'
            }`}>
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {isDragActive ? '파일을 놓아주세요' : 'PDF 파일을 드래그하거나 클릭하여 업로드'}
            </h3>
            <p className="text-gray-600 text-lg mb-4">
              PDF 형식만 지원됩니다 (최대 10MB)
            </p>
            <div className={`inline-flex items-center px-6 py-3 text-white rounded-xl font-medium shadow-lg transition-all duration-300 ${
              isDragActive
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 group-hover:shadow-xl'
            }`}>
              <Upload className="w-5 h-5 mr-2" />
              파일 선택하기
            </div>
          </div>
      </div>

      {/* 업로드된 파일 정보 */}
      {uploadedFile && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-400">
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{uploadedFile.name}</h3>
                  <p className="text-gray-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • 업로드 완료
                  </p>
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  <span className="font-medium">준비됨</span>
                </div>
            </div>
          </div>
        </div>
      )}

        {/* 분석 중 */}
      {loading && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">AI가 분석하고 있습니다</h3>
              <p className="text-gray-600 text-lg">잠시만 기다려주세요...</p>
              <div className="mt-6 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {analysis === 'error' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-red-800 mb-4">
              ❌ 분석 실패
            </h2>
            
            <p className="text-red-700 text-lg mb-6">
              분석 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>

            <div className="bg-red-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">오류 내용</h3>
              <p className="text-red-700">{analysisData?.error}</p>
            </div>

            <div className="bg-red-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">💡 해결 방법</h3>
              <ul className="text-red-700 text-left space-y-1">
                <li>1. 파일이 PDF 형식인지 확인해주세요</li>
                <li>2. 파일 크기가 10MB 이하인지 확인해주세요</li>
                <li>3. 네트워크 연결을 확인해주세요</li>
                <li>4. 잠시 후 다시 시도해주세요</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setAnalysis('')
                setAnalysisData(null)
                setFileInfo(null)
                setUploadedFile(null)
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      )}

      {/* 분석 완료 카드 */}
      {analysisData && analysisData.analysis && (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 분석이 완료되었습니다!
              </h2>
              
              <p className="text-gray-600 text-lg mb-8">
                AI가 당신의 자기소개서를 상세히 분석했습니다.<br/>
                전문적인 보고서 형태로 결과를 확인해보세요.
              </p>

              {/* 파일 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📄 분석된 파일 정보</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>파일명:</strong> {uploadedFile?.name}</p>
                  <p><strong>파일 크기:</strong> {uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}</p>
                  <p><strong>분석 시간:</strong> {fileInfo?.analyzedAt ? new Date(fileInfo.analyzedAt).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR')}</p>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    // Firebase ID가 있으면 직접 링크로 이동, 없으면 state로 전달
                    if (fileInfo.firestore_id) {
                      navigate(`/resume-report/${fileInfo.firestore_id}`)
                    } else {
                      navigate('/resume-report', { 
                        state: { 
                          analysis: analysisData, 
                          fileInfo: fileInfo 
                        } 
                      })
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FileBarChart className="w-6 h-6" />
                  <span>📊 상세 분석 보고서 보기</span>
                </button>

                <button
                  onClick={() => {
                    setAnalysis('')
                    setAnalysisData(null)
                    setFileInfo(null)
                    setUploadedFile(null)
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>새 파일 분석하기</span>
                </button>
              </div>

              {/* 간단한 미리보기 */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">📋 분석 미리보기</h4>
                <p className="text-blue-700 text-sm">
                  구체성, 구조 및 논리성, 경험 및 성과, 개선사항 등 6개 섹션으로 나누어진 
                  상세한 분석 보고서를 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default ResumeUpload
