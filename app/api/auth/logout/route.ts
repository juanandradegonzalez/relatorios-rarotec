import { NextResponse } from 'next/server'
import { logoutUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    await logoutUser()

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete('session_token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
