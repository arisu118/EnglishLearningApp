'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, RotateCcw, Check, X, Play } from 'lucide-react'
import { Topic, Vocabulary } from '../types'

interface VocabularySectionProps {
  topic: Topic
  onBack: () => void
  onStartQuiz: () => void
}

export default function VocabularySection({ topic, onBack, onStartQuiz }: VocabularySectionProps) {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVocabularies()
  }, [topic.id])

  const loadVocabularies = async () => {
    try {
      const response = await fetch(`/api/topics/${topic.id}/vocabularies`)
      const data = await response.json()
      setVocabularies(data)
    } catch (error) {
      console.error('Failed to load vocabularies:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentVocab = vocabularies[currentIndex]

  const handleNext = (understood: boolean) => {
    // Here you could track progress
    if (currentIndex < vocabularies.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
    }
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (vocabularies.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">No vocabulary found</h2>
        <button onClick={onBack} className="btn-primary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topics
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topics
        </button>
        <h2 className="text-3xl font-bold text-gray-800">Learning: {topic.name}</h2>
        <div className="text-sm text-gray-600">
          {currentIndex + 1} / {vocabularies.length}
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <div
          onClick={handleFlip}
          className="flashcard flex items-center justify-center p-8 cursor-pointer"
        >
          {!isFlipped ? (
            <div className="text-center">
              <h1 className="text-5xl font-bold mb-6">{currentVocab.word}</h1>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                <RotateCcw className="h-5 w-5 mr-2 inline" />
                Show Meaning
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">{currentVocab.meaning}</h2>
              <p className="text-xl mb-4 opacity-90">{currentVocab.pronunciation}</p>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-6">
                <p className="text-lg italic">"{currentVocab.example}"</p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext(true)
                  }}
                  className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Check className="h-5 w-5 mr-2 inline" />
                  Got it!
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNext(false)
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <X className="h-5 w-5 mr-2 inline" />
                  Need practice
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
        ></div>
      </div>

      {/* Quiz Button */}
      <div className="text-center">
        <button onClick={onStartQuiz} className="btn-primary text-lg px-8 py-4">
          <Play className="h-5 w-5 mr-2" />
          Take Quiz
        </button>
      </div>

      {/* Completion Message */}
      {currentIndex === vocabularies.length - 1 && isFlipped && (
        <div className="mt-8 p-6 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
          <h3 className="text-xl font-semibold mb-2">🎉 Congratulations!</h3>
          <p>You've completed all words in this topic. Ready for the quiz?</p>
        </div>
      )}
    </div>
  )
}
