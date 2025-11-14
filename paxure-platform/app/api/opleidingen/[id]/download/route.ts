import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { jsPDF } from 'jspdf'

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

    // Get opleiding with related data
    const { data: opleiding, error: opleidingError } = await supabase
      .from('opleidingen')
      .select(`
        *,
        opleider:profiles!opleidingen_opleider_id_fkey(full_name, email),
        document:documents(file_name, file_path)
      `)
      .eq('id', id)
      .single()

    if (opleidingError || !opleiding) {
      return NextResponse.json({ error: 'Opleiding niet gevonden' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(color)
      
      const maxWidth = pageWidth - (margin * 2)
      const lines = doc.splitTextToSize(text, maxWidth)
      
      if (yPos + (lines.length * fontSize * 0.4) > pageHeight - margin) {
        doc.addPage()
        yPos = margin
      }
      
      lines.forEach((line: string) => {
        doc.text(line, margin, yPos)
        yPos += fontSize * 0.4
      })
      yPos += 5
    }

    // Title
    addText(opleiding.taak, 20, true, '#8B1538')
    yPos += 5

    // Subtitle
    if (opleiding.deeltaak) {
      addText(opleiding.deeltaak, 14, true)
      yPos += 5
    }

    // Processtap badge
    if (opleiding.processtap) {
      const processtappen: Record<string, string> = {
        inbound: 'Inbound',
        picking: 'Picking',
        packing: 'Packing',
        controle: 'Controle',
        outbound: 'Outbound',
        vas: 'VAS',
        afwijkingen: 'Afwijkingen',
      }
      addText(`Processtap: ${processtappen[opleiding.processtap] || opleiding.processtap}`, 12, false, '#666666')
      yPos += 5
    }

    yPos += 5

    // Algemene Informatie section
    addText('Algemene Informatie', 16, true, '#8B1538')
    yPos += 5

    if (opleiding.doel) {
      addText('Doel:', 12, true)
      addText(opleiding.doel, 11)
    }

    if (opleiding.duur) {
      addText('Duur:', 12, true)
      addText(opleiding.duur, 11)
    }

    if (opleiding.opleider) {
      const opleider = opleiding.opleider as any
      addText('Opleider:', 12, true)
      addText(opleider.full_name || opleider.email || 'Niet opgegeven', 11)
    }

    if (opleiding.doelgroep) {
      addText('Doelgroep:', 12, true)
      addText(opleiding.doelgroep, 11)
    }

    if (opleiding.voorkennis_vereist) {
      addText('Voorkennis Vereist:', 12, true)
      addText(opleiding.voorkennis_vereist, 11)
    }

    if (opleiding.capaciteiten_vereist && opleiding.capaciteiten_vereist.length > 0) {
      addText('Vereiste Capaciteiten:', 12, true)
      addText(opleiding.capaciteiten_vereist.join(', '), 11)
    }

    yPos += 5

    // Opleidingsmethode section
    if (opleiding.opleidingsmethode && opleiding.opleidingsmethode.length > 0) {
      addText('Opleidingsmethode', 16, true, '#8B1538')
      yPos += 5
      opleiding.opleidingsmethode.forEach((methode: string) => {
        addText(`• ${methode}`, 11)
      })
      yPos += 5
    }

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setTextColor('#999999')
      doc.text(
        `Gegenereerd op ${new Date().toLocaleDateString('nl-NL')} - Pagina ${i} van ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="opleiding-${opleiding.taak.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Onverwachte fout opgetreden bij het genereren van PDF' }, { status: 500 })
  }
}

