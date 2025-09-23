import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import ResumeReport from './pages/ResumeReport'
import InterviewSimulation from './pages/InterviewSimulation'
import Results from './pages/Results'
import History from './pages/History'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/resume" element={<Layout><ResumeUpload /></Layout>} />
            <Route path="/resume-report" element={<Layout><ResumeReport /></Layout>} />
            <Route path="/resume-report/:resumeId" element={<Layout><ResumeReport /></Layout>} />
            <Route path="/interview" element={<Layout><InterviewSimulation /></Layout>} />
            <Route path="/results" element={<Layout><Results /></Layout>} />
            <Route path="/results/:interviewId" element={<Layout><Results /></Layout>} />
            <Route path="/history" element={<Layout><History /></Layout>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
