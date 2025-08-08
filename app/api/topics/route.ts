import { NextResponse } from 'next/server'
import db from '../../lib/database'

export async function GET() {
  try {
    const topics = db.prepare('SELECT * FROM topics').all()
    return NextResponse.json(topics)
  } catch (error) {
    console.error('Topics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
