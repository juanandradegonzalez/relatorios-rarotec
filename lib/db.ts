import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

// Tipos para as tabelas
export interface User {
  id: string
  name: string
  email: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

export interface Entidade {
  nome: string
  cnpj: string
  orgaos: string[]
}

export interface Tecnico {
  nome: string
  email: string
}

export interface Relatorio {
  id: string
  tipo: 'servicos' | 'migracao'
  estado: string
  municipio: string
  entidades: Entidade[]
  modulos: string[]
  resumo: string | null
  data_servico: Date
  tecnicos: Tecnico[]
  emails: string[] | null
  form_data: Record<string, unknown>
  criado_por: string
  criado_em: Date
  atualizado_em: Date
  pdf_url: string | null
  emails_enviados: string[] | null
}

// Funções auxiliares para relatórios
export async function createRelatorio(data: Omit<Relatorio, 'id' | 'criado_em' | 'atualizado_em'>) {
  const result = await sql`
    INSERT INTO relatorios (
      tipo, estado, municipio, entidades, modulos, resumo, 
      data_servico, tecnicos, emails, form_data, criado_por, pdf_url
    ) VALUES (
      ${data.tipo},
      ${data.estado},
      ${data.municipio},
      ${JSON.stringify(data.entidades)},
      ${data.modulos},
      ${data.resumo},
      ${data.data_servico},
      ${JSON.stringify(data.tecnicos)},
      ${data.emails},
      ${JSON.stringify(data.form_data)},
      ${data.criado_por},
      ${data.pdf_url}
    )
    RETURNING *
  `
  return result[0] as Relatorio
}

export async function getRelatorios(userId: string, filters?: {
  tipo?: string
  estado?: string
  municipio?: string
  dataInicio?: string
  dataFim?: string
  tecnico?: string
  busca?: string
  limit?: number
  offset?: number
}) {
  const limit = filters?.limit || 20
  const offset = filters?.offset || 0
  
  let query = `
    SELECT * FROM relatorios 
    WHERE criado_por = $1
  `
  const params: unknown[] = [userId]
  let paramIndex = 2
  
  if (filters?.tipo && filters.tipo !== 'todos') {
    query += ` AND tipo = $${paramIndex}`
    params.push(filters.tipo)
    paramIndex++
  }
  
  if (filters?.estado) {
    query += ` AND estado = $${paramIndex}`
    params.push(filters.estado)
    paramIndex++
  }
  
  if (filters?.municipio) {
    query += ` AND municipio ILIKE $${paramIndex}`
    params.push(`%${filters.municipio}%`)
    paramIndex++
  }
  
  if (filters?.dataInicio) {
    query += ` AND data_servico >= $${paramIndex}`
    params.push(filters.dataInicio)
    paramIndex++
  }
  
  if (filters?.dataFim) {
    query += ` AND data_servico <= $${paramIndex}`
    params.push(filters.dataFim)
    paramIndex++
  }
  
  if (filters?.busca) {
    query += ` AND (
      municipio ILIKE $${paramIndex} 
      OR entidades::text ILIKE $${paramIndex}
    )`
    params.push(`%${filters.busca}%`)
    paramIndex++
  }
  
  query += ` ORDER BY criado_em DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
  params.push(limit, offset)
  
  const result = await sql(query, params)
  return result as Relatorio[]
}

export async function getRelatorioById(id: string, userId: string) {
  const result = await sql`
    SELECT * FROM relatorios 
    WHERE id = ${id} AND criado_por = ${userId}
  `
  return result[0] as Relatorio | undefined
}

export async function updateRelatorio(id: string, userId: string, data: Partial<Relatorio>) {
  const result = await sql`
    UPDATE relatorios 
    SET 
      pdf_url = COALESCE(${data.pdf_url}, pdf_url),
      emails_enviados = COALESCE(${data.emails_enviados}, emails_enviados),
      atualizado_em = NOW()
    WHERE id = ${id} AND criado_por = ${userId}
    RETURNING *
  `
  return result[0] as Relatorio | undefined
}

export async function getRelatoriosStats(userId: string) {
  const result = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE criado_em >= DATE_TRUNC('month', CURRENT_DATE)) as este_mes,
      COUNT(*) FILTER (WHERE tipo = 'servicos') as servicos,
      COUNT(*) FILTER (WHERE tipo = 'migracao') as migracoes
    FROM relatorios 
    WHERE criado_por = ${userId}
  `
  return result[0] as {
    total: number
    este_mes: number
    servicos: number
    migracoes: number
  }
}
