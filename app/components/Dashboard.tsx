'use client'

import { useState, useEffect } from 'react'
import { User, Topic, Progress } from '../types'
import TopicCard from './TopicCard'
import VocabularySection from './VocabularySection'
import QuizSection from './QuizSection'
import { BarChart3, BookOpen, Trophy } from 'lucide-react'

interface DashboardProps {
  user: User
}

type View = 'dashboard' | 'vocabulary' | 'quiz' | 'results'

export default function Dashboard({ user }: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [progress, setProgress] = useState<Progress>({
    learned_words: 0,
    average_score: 0,
    quizzes_taken: 0
  })
  const [quizScore, setQuizScore] = useState<any>(null)

  useEffect(() => {
    loadTopics()
    loadProgress()
  }, [])

  const loadTopics = async () => {
    try {
      const response = await fetch('/api/topics')
      const data = await response.json()
      setTopics(data)
    } catch (error) {
      console.error('Failed to load topics:', error)
    }
  }

  const loadProgress = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic)
    setCurrentView('vocabulary')
  }

  const handleStartQuiz = () => {
    setCurrentView('quiz')
  }

  const handleQuizComplete = (score: any) => {
    setQuizScore(score)
    setCurrentView('results')
    loadProgress() // Refresh progress after quiz
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedTopic(null)
    setQuizScore(null)
  }

  if (currentView === 'vocabulary' && selectedTopic) {
    return (
      <VocabularySection
        topic={selectedTopic}
        onBack={handleBackToDashboard}
        onStartQuiz={handleStartQuiz}
      />
    )
  }

  if (currentView === 'quiz' && selectedTopic) {
    return (
      <QuizSection
        topic={selectedTopic}
        onBack={() => setCurrentView('vocabulary')}
        onComplete={handleQuizComplete}
      />
    )
  }

  if (currentView === 'results' && quizScore) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Quiz Results</h2>
          
          <div className="text-6xl font-bold mb-4">
            <span className={`${
              quizScore.score >= 90 ? 'text-green-500' :
              quizScore.score >= 70 ? 'text-blue-500' :
              quizScore.score >= 50 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {quizScore.score.toFixed(1)}%
            </span>
          </div>
          
          <p className="text-xl text-gray-600 mb-6">
            You got <strong>{quizScore.correct}</strong> out of <strong>{quizScore.total}</strong> questions correct!
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div 
              className={`h-4 rounded-full ${
                quizScore.score >= 90 ? 'bg-green-500' :
                quizScore.score >= 70 ? 'bg-blue-500' :
                quizScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${quizScore.score}%` }}
            ></div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button onClick={handleBackToDashboard} className="btn-primary">
              Back to Topics
            </button>
            <button onClick={handleStartQuiz} className="btn-outline">
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-3">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Choose a Topic</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic)}
            />
          ))}
        </div>
      </div>

      {/* Progress Sidebar */}
      <div className="lg:col-span-1">
        <div className="card">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold">Your Progress</h3>
          </div>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{progress.learned_words}</div>
              <div className="text-sm text-gray-600">Words Learned</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{progress.average_score.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{progress.quizzes_taken}</div>
              <div className="text-sm text-gray-600">Quizzes Taken</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
