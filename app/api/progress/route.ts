import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import db from '../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    const userId = decoded.user_id

    // Get user's learning statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT p.vocab_id) as learned_words,
        AVG(r.score) as avg_score,
        COUNT(DISTINCT r.id) as quizzes_taken
      FROM progress p
      LEFT JOIN results r ON r.user_id = p.user_id
      WHERE p.user_id = ?
    `).get(userId) as any

    return NextResponse.json({
      learned_words: stats?.learned_words || 0,
      average_score: Math.round((stats?.avg_score || 0) * 100) / 100,
      quizzes_taken: stats?.quizzes_taken || 0
    })

  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
