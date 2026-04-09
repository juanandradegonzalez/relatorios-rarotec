import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const funcionarios = await sql`
      SELECT id, name, email 
      FROM users 
      WHERE email != 'admin@rarotec.com.br'
      ORDER BY name ASC
    `
    
    return NextResponse.json({ funcionarios })
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar funcionários' },
      { status: 500 }
    )
  }
}
