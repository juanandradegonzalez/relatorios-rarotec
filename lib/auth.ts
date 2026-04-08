import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const sql = neon(process.env.DATABASE_URL!)

// Types
export interface User {
  id: string
  name: string
  email: string
  created_at: Date
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
}

// Generate secure token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  for (let i = 0; i < 64; i++) {
    token += chars[array[i] % chars.length]
  }
  return token
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Register user
export async function registerUser(name: string, email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    // Check if user exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0) {
      return { error: 'Email já cadastrado' }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email.toLowerCase()}, ${passwordHash})
      RETURNING id, name, email, created_at
    `

    return { user: result[0] as User }
  } catch (error) {
    console.error('Register error:', error)
    return { error: 'Erro ao criar conta' }
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user?: User; token?: string; error?: string }> {
  try {
    // Find user
    const users = await sql`
      SELECT id, name, email, password_hash, created_at
      FROM users WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      return { error: 'Email ou senha incorretos' }
    }

    const user = users[0]

    // Verify password
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return { error: 'Email ou senha incorretos' }
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      },
      token
    }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Erro ao fazer login' }
  }
}

// Get current user from session
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (!token) return null

    const result = await sql`
      SELECT u.id, u.name, u.email, u.created_at
      FROM users u
      JOIN sessions s ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `

    if (result.length === 0) return null

    return result[0] as User
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Logout user
export async function logoutUser(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value

    if (token) {
      await sql`DELETE FROM sessions WHERE token = ${token}`
    }
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`DELETE FROM sessions WHERE expires_at < NOW()`
  } catch (error) {
    console.error('Cleanup sessions error:', error)
  }
}
