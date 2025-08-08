import { NextRequest, NextResponse } from 'next/server'
import db from '../../../../lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const topicId = parseInt(params.id)
    const vocabularies = db.prepare('SELECT * FROM vocabularies WHERE topic_id = ?').all(topicId)
    return NextResponse.json(vocabularies)
  } catch (error) {
    console.error('Vocabularies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
