import { NextRequest, NextResponse } from 'next/server'
import { registerUser, loginUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Register user
    const registerResult = await registerUser(name, email, password)

    if (registerResult.error) {
      return NextResponse.json(
        { error: registerResult.error },
        { status: 400 }
      )
    }

    // Auto login after register
    const loginResult = await loginUser(email, password)

    if (loginResult.error) {
      return NextResponse.json(
        { error: 'Conta criada, mas erro ao fazer login automático' },
        { status: 500 }
      )
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', loginResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return NextResponse.json({ user: loginResult.user })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
