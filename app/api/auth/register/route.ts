import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import db from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)

    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Insert user
    const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword)

    return NextResponse.json({
      success: true,
      user_id: result.lastInsertRowid
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
