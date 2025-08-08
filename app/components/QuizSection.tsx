'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Topic, Quiz, QuizResult } from '../types'

interface QuizSectionProps {
  topic: Topic
  onBack: () => void
  onComplete: (score: any) => void
}

export default function QuizSection({ topic, onBack, onComplete }: QuizSectionProps) {
  const [quiz, setQuiz] = useState<Quiz[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizResult[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuiz()
  }, [topic.id])

  const loadQuiz = async () => {
    try {
      const response = await fetch(`/api/topics/${topic.id}/quiz`)
      const data = await response.json()
      setQuiz(data)
    } catch (error) {
      console.error('Failed to load quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNext = () => {
    if (!selectedAnswer) return

    const currentQuestion = quiz[currentIndex]
    const newAnswer: QuizResult = {
      quiz_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correct_answer,
      is_correct: selectedAnswer === currentQuestion.correct_answer
    }

    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    if (currentIndex < quiz.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer('')
    } else {
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers: QuizResult[]) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ results: finalAnswers })
      })

      const result = await response.json()
      onComplete(result)
    } catch (error) {
      console.error('Failed to submit quiz:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (quiz.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">No quiz available</h2>
        <button onClick={onBack} className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vocabulary
        </button>
      </div>
    )
  }

  const currentQuestion = quiz[currentIndex]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vocabulary
        </button>
        <h2 className="text-3xl font-bold text-gray-800">Quiz: {topic.name}</h2>
        <div className="text-sm text-gray-600">
          Question {currentIndex + 1} of {quiz.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-green-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.length) * 100}%` }}
        ></div>
      </div>

      {/* Question */}
      <div className="card mb-8">
        <h3 className="text-2xl font-bold mb-6">{currentQuestion.question}</h3>
        
        <div className="space-y-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handleAnswerSelect(key)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold mr-3">{key}.</span>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <div className="text-center">
        <button
          onClick={handleNext}
          disabled={!selectedAnswer}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg px-8 py-4"
        >
          {currentIndex === quiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  )
}
