import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { emails, pdfBase64, tipoRelatorio, clienteNome, municipio, dataServico } = await req.json()

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum email informado' },
        { status: 400 }
      )
    }

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF não fornecido' },
        { status: 400 }
      )
    }

    // Converter base64 para Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64')

    // Enviar email para cada destinatário
    const emailPromises = emails.map(async (email: string) => {
      return resend.emails.send({
        from: 'Rarotec Relatórios <relatorios@rarotec.com.br>',
        to: email.trim(),
        subject: `Relatório Técnico - ${tipoRelatorio === 'servicos' ? 'Serviços' : 'Migração'} - ${municipio || 'N/A'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 20px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Rarotec Tecnologia</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Sistema de Relatórios Técnicos</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e3a5f; margin-top: 0;">Novo Relatório Gerado</h2>
              
              <p style="color: #475569; line-height: 1.6;">
                Um novo relatório técnico foi gerado e está anexado a este email.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="color: #1e3a5f; margin-top: 0; font-size: 16px;">Detalhes do Relatório</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 40%;">Tipo:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${tipoRelatorio === 'servicos' ? 'Serviços Técnicos' : 'Migração'}</td>
                  </tr>
                  ${municipio ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Município:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${municipio}</td>
                  </tr>
                  ` : ''}
                  ${dataServico ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Data do Serviço:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${dataServico}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">
                O arquivo PDF está anexado a este email. Caso não consiga visualizar, entre em contato conosco.
              </p>
            </div>
            
            <div style="background: #1e293b; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
              <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} Rarotec Tecnologia. Todos os direitos reservados.
              </p>
              <p style="color: #64748b; margin: 10px 0 0 0; font-size: 11px;">
                Este é um email automático, por favor não responda.
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `relatorio-${tipoRelatorio}-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer,
          },
        ],
      })
    })

    const results = await Promise.allSettled(emailPromises)
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length

    if (failCount > 0) {
      console.error('Alguns emails falharam:', results.filter(r => r.status === 'rejected'))
    }

    return NextResponse.json({
      success: true,
      message: `${successCount} email(s) enviado(s) com sucesso${failCount > 0 ? `, ${failCount} falhou(aram)` : ''}`,
      successCount,
      failCount,
    })
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar email', details: String(error) },
      { status: 500 }
    )
  }
}
