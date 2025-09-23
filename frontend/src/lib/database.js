import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

// 컬렉션 참조들
const getResumesCollection = (userId) => collection(db, 'users', userId, 'resumes')

// 실제 Firestore 서비스
export const resumeService = {
  async saveResumeAnalysis(userId, analysisData) {
    try {
      const docRef = await addDoc(getResumesCollection(userId), {
        ...analysisData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // 통계 업데이트
      await this.updateResumeStats(userId)
      
      return { data: docRef.id, error: null }
    } catch (error) {
      console.error('Firestore 저장 에러:', error)
      return { data: null, error }
    }
  },
  
  async getResumeAnalyses(userId) {
    try {
      const q = query(getResumesCollection(userId), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return { data, error: null }
    } catch (error) {
      console.error('Firestore 조회 에러:', error)
      return { data: [], error }
    }
  },
  
  async deleteResumeAnalysis(userId, resumeId) {
    try {
      await deleteDoc(doc(db, 'users', userId, 'resumes', resumeId))
      return { error: null }
    } catch (error) {
      console.error('Firestore 삭제 에러:', error)
      return { error }
    }
  },
  
  async updateResumeStats(userId) {
    try {
      // 현재 통계 가져오기
      const currentStats = await statsService.getUserStats(userId)
      const stats = currentStats.data
      
      // 자기소개서 개수 업데이트
      const newStats = {
        ...stats,
        totalResumes: stats.totalResumes + 1
      }
      
      // 통계 업데이트
      await statsService.updateUserStats(userId, newStats)
    } catch (error) {
      console.error('자기소개서 통계 업데이트 에러:', error)
    }
  }
}

export const interviewService = {
  async saveInterviewSession(userId, sessionData) {
    try {
      const interviewsCollection = collection(db, 'users', userId, 'interviews')
      const docRef = await addDoc(interviewsCollection, {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      // 통계 업데이트
      await this.updateInterviewStats(userId, sessionData)
      
      return { data: docRef.id, error: null }
    } catch (error) {
      console.error('면접 세션 저장 에러:', error)
      return { data: null, error }
    }
  },
  
  async getInterviewSessions(userId) {
    try {
      const interviewsCollection = collection(db, 'users', userId, 'interviews')
      const q = query(interviewsCollection, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      return { data, error: null }
    } catch (error) {
      console.error('면접 세션 조회 에러:', error)
      return { data: [], error }
    }
  },
  
  async updateInterviewSession(userId, sessionId, updates) {
    try {
      const interviewDocRef = doc(db, 'users', userId, 'interviews', sessionId)
      await updateDoc(interviewDocRef, {
        ...updates,
        updatedAt: serverTimestamp()
      })
      return { error: null }
    } catch (error) {
      console.error('면접 세션 업데이트 에러:', error)
      return { error }
    }
  },
  
  async updateInterviewStats(userId, sessionData) {
    try {
      // 현재 통계 가져오기
      const currentStats = await statsService.getUserStats(userId)
      const stats = currentStats.data
      
      // 새로운 통계 계산
      const newStats = {
        totalInterviews: stats.totalInterviews + 1,
        averageScore: sessionData.finalScore ? 
          Math.round(((stats.averageScore * stats.totalInterviews) + sessionData.finalScore) / (stats.totalInterviews + 1)) : 
          stats.averageScore,
        totalQuestions: stats.totalQuestions + (sessionData.questions?.length || 0),
        improvementCount: sessionData.improvementCount || stats.improvementCount
      }
      
      // 통계 업데이트
      await statsService.updateUserStats(userId, newStats)
    } catch (error) {
      console.error('면접 통계 업데이트 에러:', error)
    }
  }
}

export const questionService = {
  async saveQuestions(userId, questions) {
    try {
      console.log('=== 질문 저장 시작 ===')
      console.log('사용자 ID:', userId)
      console.log('질문 개수:', questions.length)
      
      const questionsCollection = collection(db, 'users', userId, 'questions')
      
      // 각 질문을 개별 문서로 저장
      const savedQuestions = []
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        const docRef = await addDoc(questionsCollection, {
          ...question,
          questionIndex: i,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        savedQuestions.push({
          id: docRef.id,
          ...question,
          questionIndex: i
        })
        
        console.log(`질문 ${i + 1} 저장 완료:`, docRef.id)
      }
      
      console.log('✅ 모든 질문 저장 완료:', savedQuestions.length, '개')
      return { data: savedQuestions, error: null }
    } catch (error) {
      console.error('❌ 질문 저장 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return { data: [], error }
    }
  },
  
  async getQuestions(userId) {
    try {
      console.log('=== 질문 조회 시작 ===')
      console.log('사용자 ID:', userId)
      
      const questionsCollection = collection(db, 'users', userId, 'questions')
      const q = query(questionsCollection, orderBy('questionIndex', 'asc'))
      const querySnapshot = await getDocs(q)
      
      const questions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('✅ 질문 조회 완료:', questions.length, '개')
      return { data: questions, error: null }
    } catch (error) {
      console.error('❌ 질문 조회 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return { data: [], error }
    }
  },
  
  async deleteQuestions(userId) {
    try {
      console.log('=== 질문 삭제 시작 ===')
      console.log('사용자 ID:', userId)
      
      const questionsCollection = collection(db, 'users', userId, 'questions')
      const q = query(questionsCollection)
      const querySnapshot = await getDocs(q)
      
      // 모든 질문 문서 삭제
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      console.log('✅ 모든 질문 삭제 완료:', querySnapshot.docs.length, '개')
      return { error: null }
    } catch (error) {
      console.error('❌ 질문 삭제 실패:', error)
      console.error('에러 코드:', error.code)
      console.error('에러 메시지:', error.message)
      
      return { error }
    }
  }
}

export const statsService = {
  async updateUserStats(userId, stats) {
    try {
      const userDocRef = doc(db, 'users', userId)
      await setDoc(userDocRef, {
        ...stats,
        updatedAt: serverTimestamp()
      }, { merge: true })
      return { error: null }
    } catch (error) {
      console.error('통계 업데이트 에러:', error)
      return { error }
    }
  },
  
  async createSampleData(userId) {
    try {
      const userDocRef = doc(db, 'users', userId)
      const sampleStats = {
        totalInterviews: 3,
        averageScore: 85,
        totalResumes: 2,
        totalQuestions: 15,
        improvementCount: 5,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      await setDoc(userDocRef, sampleStats, { merge: true })
      return { error: null }
    } catch (error) {
      console.error('샘플 데이터 생성 에러:', error)
      return { error }
    }
  },
  
  async getUserStats(userId) {
    try {
      // 사용자 문서에서 통계 데이터 가져오기
      const userDocRef = doc(db, 'users', userId)
      const userDoc = await getDoc(userDocRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return {
          data: {
            totalInterviews: userData.totalInterviews || 0,
            averageScore: userData.averageScore || 0,
            totalResumes: userData.totalResumes || 0,
            totalQuestions: userData.totalQuestions || 0,
            improvementCount: userData.improvementCount || 0
          },
          error: null
        }
      } else {
        // 사용자 문서가 없으면 기본값 반환
        return {
          data: {
            totalInterviews: 0,
            averageScore: 0,
            totalResumes: 0,
            totalQuestions: 0,
            improvementCount: 0
          },
          error: null
        }
      }
    } catch (error) {
      console.error('통계 조회 에러:', error)
      return { 
        data: {
          totalInterviews: 0,
          averageScore: 0,
          totalResumes: 0,
          totalQuestions: 0,
          improvementCount: 0
        }, 
        error 
      }
    }
  }
}
