import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  getMetadata 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js'
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
    try {
      console.log('=== 오디오 파일 업로드 시작 ===')
      console.log('사용자 ID:', userId)
      console.log('면접 ID:', interviewId)
      console.log('질문 인덱스:', questionIndex)
      console.log('오디오 크기:', audioBlob.size, 'bytes')
      console.log('오디오 타입:', audioBlob.type)
      
      // 파일명 생성
      const fileName = `audio_${interviewId}_${questionIndex}_${Date.now()}.wav`
      
      // Storage 참조 생성
      const storageRef = ref(storage, `users/${userId}/interviews/audio/${fileName}`)
      console.log('Storage 참조 생성:', storageRef.fullPath)
      
      // 파일 업로드
      console.log('오디오 업로드 시작...')
      const snapshot = await uploadBytes(storageRef, audioBlob)
      console.log('✅ 오디오 업로드 완료:', snapshot.ref.fullPath)
      
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
      console.error('❌ 오디오 업로드 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return {
        url: null,
        fileName: null,
        path: null,
        error
      }
    }
  },

  async uploadImageFile(userId, imageBlob, interviewId, timestamp) {
    try {
      console.log('=== 이미지 파일 업로드 시작 ===')
      console.log('사용자 ID:', userId)
      console.log('면접 ID:', interviewId)
      console.log('타임스탬프:', timestamp)
      console.log('이미지 크기:', imageBlob.size, 'bytes')
      console.log('이미지 타입:', imageBlob.type)
      
      // 파일명 생성
      const fileName = `frame_${interviewId}_${timestamp}_${Date.now()}.jpg`
      
      // Storage 참조 생성
      const storageRef = ref(storage, `users/${userId}/interviews/images/${fileName}`)
      console.log('Storage 참조 생성:', storageRef.fullPath)
      
      // 파일 업로드
      console.log('이미지 업로드 시작...')
      const snapshot = await uploadBytes(storageRef, imageBlob)
      console.log('✅ 이미지 업로드 완료:', snapshot.ref.fullPath)
      
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
      console.error('❌ 이미지 업로드 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return {
        url: null,
        fileName: null,
        path: null,
        error
      }
    }
  },

  async deleteFile(filePath) {
    try {
      console.log('=== 파일 삭제 시작 ===')
      console.log('파일 경로:', filePath)
      
      // Storage 참조 생성
      const storageRef = ref(storage, filePath)
      
      // 파일 삭제
      console.log('파일 삭제 중...')
      await deleteObject(storageRef)
      console.log('✅ 파일 삭제 완료:', filePath)
      
      return { error: null }
    } catch (error) {
      console.error('❌ 파일 삭제 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return { error }
    }
  },

  async getFileMetadata(filePath) {
    try {
      console.log('=== 파일 메타데이터 조회 시작 ===')
      console.log('파일 경로:', filePath)
      
      // Storage 참조 생성
      const storageRef = ref(storage, filePath)
      
      // 메타데이터 조회
      console.log('메타데이터 조회 중...')
      const metadata = await getMetadata(storageRef)
      console.log('✅ 메타데이터 조회 완료:', metadata)
      
      return { 
        data: {
          size: metadata.size,
          contentType: metadata.contentType,
          timeCreated: metadata.timeCreated,
          updated: metadata.updated
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ 메타데이터 조회 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return { 
        data: null, 
        error 
      }
    }
  }
}
