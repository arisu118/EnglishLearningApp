import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'
import db from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    const userId = decoded.user_id

    const { results } = await request.json()
    
    const totalQuestions = results.length
    const correctAnswers = results.filter((result: any) => result.is_correct).length
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    // Save result to database
    db.prepare('INSERT INTO results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)')
      .run(userId, results[0]?.quiz_id || 0, score, totalQuestions)

    return NextResponse.json({
      score,
      correct: correctAnswers,
      total: totalQuestions
    })

  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
