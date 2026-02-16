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

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .select('*, creator:profiles!meetings_created_by_fkey(full_name)')
      .eq('id', id)
      .single()

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting niet gevonden' }, { status: 404 })
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(color)

      const maxWidth = pageWidth - margin * 2
      const lines = doc.splitTextToSize(text, maxWidth)

      if (yPos + lines.length * fontSize * 0.4 > pageHeight - margin) {
        doc.addPage()
        yPos = margin
      }

      lines.forEach((line: string) => {
        doc.text(line, margin, yPos)
        yPos += fontSize * 0.4
      })
      yPos += 5
    }

    addText('Meetingverslag', 16, true, '#8B1538')
    yPos += 5

    addText(meeting.titel, 14, true)
    yPos += 5

    addText(`Datum: ${new Date(meeting.datum).toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 11)
    yPos += 5

    const creator = (meeting as any).creator as { full_name?: string } | null
    if (creator?.full_name) {
      addText(`Notulist: ${creator.full_name}`, 11)
      yPos += 5
    }

    if (meeting.aanwezigen) {
      addText('Aanwezigen', 12, true)
      addText(meeting.aanwezigen, 11)
    }

    if (meeting.notities) {
      addText('Notities', 12, true)
      addText(meeting.notities, 11)
    }

    if (meeting.actiepunten && meeting.actiepunten.length > 0) {
      addText('Actiepunten', 12, true)
      meeting.actiepunten.forEach((punt: string) => {
        addText(`• ${punt}`, 11)
      })
    }

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

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const safeTitle = meeting.titel.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="meetingverslag-${safeTitle}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Meeting PDF error:', error)
    return NextResponse.json({ error: 'Onverwachte fout bij het genereren van PDF' }, { status: 500 })
  }
}
