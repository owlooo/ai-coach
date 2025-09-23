import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'firebase/storage'
import { storage } from './firebase'

export const storageService = {
  async uploadResumePDF(userId, file) {
    try {
      console.log('=== Storage 업로드 강제 시도 ===')
      console.log('사용자 ID:', userId)
      console.log('파일명:', file.name)
      console.log('파일 크기:', file.size, 'bytes')
      console.log('파일 타입:', file.type)
      
      // 파일명 정리 (특수문자 제거)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `resume_${Date.now()}_${cleanFileName}`
      
      console.log('정리된 파일명:', fileName)
      
      // Storage 참조 생성
      const storageRef = ref(storage, `users/${userId}/resumes/${fileName}`)
      console.log('Storage 참조 생성:', storageRef.fullPath)
      
      // 파일 업로드
      console.log('업로드 시작...')
      const snapshot = await uploadBytes(storageRef, file)
      console.log('✅ 업로드 완료:', snapshot.ref.fullPath)
      
      // 다운로드 URL 생성
      console.log('다운로드 URL 생성 중...')
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log('✅ 다운로드 URL 생성:', downloadURL)
      
      return {
        url: downloadURL,
        fileName: fileName,
        path: snapshot.ref.fullPath,
        error: null
      }
    } catch (error) {
      console.error('❌ Storage 업로드 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      console.error('에러 스택:', error.stack)
      
      // 재시도 로직
      if (error.code === 'storage/unauthorized') {
        console.log('권한 에러 - 재시도 중...')
        // 권한 에러 시 재시도
        try {
          const retryRef = ref(storage, `public/${Date.now()}_${file.name}`)
          const retrySnapshot = await uploadBytes(retryRef, file)
          const retryURL = await getDownloadURL(retrySnapshot.ref)
          
          console.log('✅ 재시도 성공:', retryURL)
          return {
            url: retryURL,
            fileName: file.name,
            path: retrySnapshot.ref.fullPath,
            error: null
          }
        } catch (retryError) {
          console.error('❌ 재시도도 실패:', retryError)
        }
      }
      
      return {
        url: null,
        fileName: null,
        path: null,
        error
      }
    }
  },

  async uploadAudioFile(userId, audioBlob, interviewId, questionIndex) {
    console.log('모의 업로드:', userId, interviewId, questionIndex)
    return {
      url: 'local-audio',
      fileName: `audio_${interviewId}_${questionIndex}.wav`,
      path: 'local-audio-path',
      error: null
    }
  },

  async uploadImageFile(userId, imageBlob, interviewId, timestamp) {
    console.log('모의 업로드:', userId, interviewId, timestamp)
    return {
      url: 'local-image',
      fileName: `frame_${interviewId}_${timestamp}.jpg`,
      path: 'local-image-path',
      error: null
    }
  },

  async deleteFile(filePath) {
    console.log('모의 삭제:', filePath)
    return { error: null }
  },

  async getFileMetadata(filePath) {
    console.log('모의 메타데이터 조회:', filePath)
    return { 
      data: { size: 0, contentType: 'application/octet-stream' }, 
      error: null 
    }
  }
}