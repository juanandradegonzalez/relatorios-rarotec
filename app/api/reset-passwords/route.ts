import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Gerar hash real para a senha 123456
    const password = '123456'
    const passwordHash = await bcrypt.hash(password, 10)
    
    console.log('[v0] Hash gerado para 123456:', passwordHash)
    
    // Verificar se o hash funciona
    const isValid = await bcrypt.compare(password, passwordHash)
    console.log('[v0] Hash válido:', isValid)
    
    // Atualizar todas as senhas no banco
    const result = await sql`
      UPDATE users 
      SET password_hash = ${passwordHash}
      RETURNING id, name, email
    `
    
    console.log('[v0] Usuários atualizados:', result.length)
    
    return NextResponse.json({ 
      success: true, 
      message: `${result.length} senhas atualizadas com sucesso`,
      hash_preview: passwordHash.substring(0, 30) + '...',
      hash_valid: isValid
    })
  } catch (error) {
    console.error('[v0] Erro ao resetar senhas:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senhas', details: String(error) },
      { status: 500 }
    )
  }
}
