'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, BookOpen, Trophy, Users } from 'lucide-react'
import AuthSection from './components/AuthSection'
import Dashboard from './components/Dashboard'
import { User } from './types'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData: User, token: string) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8" />
              <h1 className="text-2xl font-bold">English Learning</h1>
            </div>
            
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-blue-100">Welcome, {user.username}!</span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!user ? (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold text-gray-800 mb-4">
                Master English Vocabulary
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Learn with interactive flashcards, take quizzes, and track your progress
              </p>
              
              {/* Features */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
                  <p className="text-gray-600">Learn with engaging flashcards and examples</p>
                </div>
                <div className="text-center">
                  <Trophy className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quiz Yourself</h3>
                  <p className="text-gray-600">Test your knowledge with interactive quizzes</p>
                </div>
                <div className="text-center">
                  <Users className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
                  <p className="text-gray-600">Monitor your learning journey and achievements</p>
                </div>
              </div>
            </div>
            
            <AuthSection onLogin={handleLogin} />
          </>
        ) : (
          <Dashboard user={user} />
        )}
      </main>
    </div>
  )
}
