export interface User {
  id: number
  username: string
  email: string
  role: string
}

export interface Topic {
  id: number
  name: string
  level: string
  description: string
}

export interface Vocabulary {
  id: number
  word: string
  meaning: string
  example: string
  pronunciation: string
  topic_id: number
}

export interface Quiz {
  id: number
  topic_id: number
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correct_answer: string
}

export interface QuizResult {
  quiz_id: number
  selected_answer: string
  correct_answer: string
  is_correct: boolean
}

export interface Progress {
  learned_words: number
  average_score: number
  quizzes_taken: number
}
