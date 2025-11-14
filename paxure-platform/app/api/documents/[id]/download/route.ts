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

    const supabase = await createClient()
    const { id } = await params

    // Get document
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document niet gevonden' }, { status: 404 })
    }

  if (!document.file_path) {
    return NextResponse.json({ error: 'Geen bestand gekoppeld' }, { status: 404 })
  }

  // Get file from storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'docs')
    .download(document.file_path)

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 })
    }

    // Return file
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': document.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${document.file_name || 'document'}"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Onverwachte fout opgetreden' }, { status: 500 })
  }
}

