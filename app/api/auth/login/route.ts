import { NextRequest, NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import db from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const isValid = await compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        user_id: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
