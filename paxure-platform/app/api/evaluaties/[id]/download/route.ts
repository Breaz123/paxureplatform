import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Get evaluatie
    const { data: evaluatie, error: evaluatieError } = await supabase
      .from('evaluaties')
      .select('*, medewerker:profiles!evaluaties_medewerker_id_fkey(full_name, email), coach:profiles!evaluaties_coach_id_fkey(full_name)')
      .eq('id', id)
      .single()

    if (evaluatieError || !evaluatie) {
      return NextResponse.json({ error: 'Evaluatie niet gevonden' }, { status: 404 })
    }

    // Check permissions
    if (user.role === 'maatwerker' && evaluatie.medewerker_id !== user.id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // If there's a PDF already, return it
    if (evaluatie.rapport_path) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'docs')
        .download(evaluatie.rapport_path)

      if (!fileError && fileData) {
        const arrayBuffer = await fileData.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="evaluatie-${id}.pdf"`,
          },
        })
      }
    }

    // Generate simple PDF content (basic HTML to PDF conversion via browser)
    // For a proper implementation, you'd use a library like pdfkit, puppeteer, or similar
    const medewerker = (evaluatie as any).medewerker as any
    const coach = (evaluatie as any).coach as any

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Evaluatie Rapport</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .info { margin: 20px 0; }
            .label { font-weight: bold; }
            .content { margin-left: 20px; margin-top: 10px; white-space: pre-wrap; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>Evaluatie Rapport</h1>
          
          <div class="info">
            <span class="label">Medewerker:</span>
            <div class="content">${(medewerker as any)?.full_name || (medewerker as any)?.email || 'Onbekend'}</div>
          </div>
          
          <div class="info">
            <span class="label">Coach:</span>
            <div class="content">${(coach as any)?.full_name || 'Onbekend'}</div>
          </div>
          
          <div class="info">
            <span class="label">Datum:</span>
            <div class="content">${new Date(evaluatie.datum).toLocaleDateString('nl-NL')}</div>
          </div>
          
          ${evaluatie.evaluatie_type ? `
          <div class="info">
            <span class="label">Type:</span>
            <div class="content">${evaluatie.evaluatie_type}</div>
          </div>
          ` : ''}
          
          ${evaluatie.notities ? `
          <h2>Notities</h2>
          <div class="content">${evaluatie.notities}</div>
          ` : ''}
          
          ${evaluatie.actiepunten && evaluatie.actiepunten.length > 0 ? `
          <h2>Actiepunten</h2>
          <ul>
            ${evaluatie.actiepunten.map((punt: string) => `<li>${punt}</li>`).join('')}
          </ul>
          ` : ''}
          
          ${evaluatie.volgende_afspraak ? `
          <div class="info">
            <span class="label">Volgende Afspraak:</span>
            <div class="content">${new Date(evaluatie.volgende_afspraak).toLocaleDateString('nl-NL')}</div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Rapport gegenereerd op ${new Date().toLocaleDateString('nl-NL')}</p>
          </div>
        </body>
      </html>
    `

    // Return HTML content (in production, convert to PDF using a service)
    // For now, return HTML that can be printed to PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="evaluatie-${id}.html"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Onverwachte fout opgetreden' }, { status: 500 })
  }
}

