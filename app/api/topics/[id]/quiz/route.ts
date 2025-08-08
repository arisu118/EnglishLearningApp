import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = parseInt(params.id)
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE topic_id = ?').all(topicId) as any[]
    
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz.id,
      topic_id: quiz.topic_id,
      question: quiz.question,
      options: {
        A: quiz.option_a,
        B: quiz.option_b,
        C: quiz.option_c,
        D: quiz.option_d
      },
      correct_answer: quiz.correct_answer
    }))
    
    return NextResponse.json(formattedQuizzes)
  } catch (error) {
    console.error('Quiz error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
