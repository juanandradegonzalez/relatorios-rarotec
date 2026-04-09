import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getCurrentUser } from '@/lib/auth'

const sql = neon(process.env.DATABASE_URL!)

// GET - Listar relatórios
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const cliente = searchParams.get('cliente')
    const estado = searchParams.get('estado')
    const municipio = searchParams.get('municipio')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const tecnico = searchParams.get('tecnico')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Query base
    let query = `
      SELECT 
        id, tipo, cliente, municipio, estado, 
        data_atendimento, tecnicos, dados, pdf_url, 
        created_at, updated_at
      FROM relatorios 
      WHERE user_id = $1
    `
    const params: any[] = [user.id]
    let paramIndex = 2

    // Filtros opcionais
    if (tipo) {
      query += ` AND tipo = $${paramIndex}`
      params.push(tipo)
      paramIndex++
    }

    if (cliente) {
      query += ` AND cliente ILIKE $${paramIndex}`
      params.push(`%${cliente}%`)
      paramIndex++
    }

    if (estado) {
      query += ` AND estado = $${paramIndex}`
      params.push(estado)
      paramIndex++
    }

    if (municipio) {
      query += ` AND municipio ILIKE $${paramIndex}`
      params.push(`%${municipio}%`)
      paramIndex++
    }

    if (dataInicio) {
      query += ` AND data_atendimento >= $${paramIndex}`
      params.push(dataInicio)
      paramIndex++
    }

    if (dataFim) {
      query += ` AND data_atendimento <= $${paramIndex}`
      params.push(dataFim)
      paramIndex++
    }

    if (tecnico) {
      query += ` AND $${paramIndex} = ANY(tecnicos)`
      params.push(tecnico)
      paramIndex++
    }

    // Ordenação e paginação
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const relatorios = await sql.query(query, params)

    // Contar total
    let countQuery = `SELECT COUNT(*) as total FROM relatorios WHERE user_id = $1`
    const countParams: any[] = [user.id]
    let countParamIndex = 2

    if (tipo) {
      countQuery += ` AND tipo = $${countParamIndex}`
      countParams.push(tipo)
      countParamIndex++
    }
    if (cliente) {
      countQuery += ` AND cliente ILIKE $${countParamIndex}`
      countParams.push(`%${cliente}%`)
      countParamIndex++
    }
    if (estado) {
      countQuery += ` AND estado = $${countParamIndex}`
      countParams.push(estado)
      countParamIndex++
    }

    const countResult = await sql.query(countQuery, countParams)
    const total = parseInt(countResult[0]?.total || '0')

    return NextResponse.json({
      relatorios,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching relatorios:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatórios' }, { status: 500 })
  }
}

// POST - Criar relatório
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      console.log("[v0] POST /api/relatorios - Não autenticado")
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] POST /api/relatorios - Body recebido:", body)
    
    const { tipo, cliente, municipio, estado, dataAtendimento, tecnicos, dados, pdfUrl } = body

    if (!tipo || !cliente || !dataAtendimento) {
      console.log("[v0] POST /api/relatorios - Campos faltando:", { tipo, cliente, dataAtendimento })
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, cliente, dataAtendimento' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO relatorios (user_id, tipo, cliente, municipio, estado, data_atendimento, tecnicos, dados, pdf_url)
      VALUES (${user.id}, ${tipo}, ${cliente}, ${municipio || null}, ${estado || null}, ${dataAtendimento}, ${tecnicos || []}, ${JSON.stringify(dados)}, ${pdfUrl || null})
      RETURNING id, tipo, cliente, municipio, estado, data_atendimento, tecnicos, created_at
    `

    return NextResponse.json({ 
      success: true, 
      relatorio: result[0] 
    })
  } catch (error) {
    console.error('Error creating relatorio:', error)
    return NextResponse.json({ error: 'Erro ao criar relatório' }, { status: 500 })
  }
}
