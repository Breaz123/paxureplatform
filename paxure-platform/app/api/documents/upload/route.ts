import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    if (!canManageDocuments(user.role)) {
      return NextResponse.json({ error: 'Geen rechten om documenten te uploaden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const documentType = formData.get('document_type') as string

    if (!file || !title || !documentType) {
      return NextResponse.json({ error: 'Titel, type en bestand zijn verplicht' }, { status: 400 })
    }

    const supabase = await createClient()

    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `documents/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'docs')
      .upload(filePath, file)

    if (uploadError) {
      return NextResponse.json({ error: 'Upload mislukt: ' + uploadError.message }, { status: 500 })
    }

    // Create document record
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        title,
        description: description || null,
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        version: 1,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (dbError || !document) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'docs')
        .remove([filePath])
      
      return NextResponse.json({ error: 'Document opslaan mislukt: ' + dbError?.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Onverwachte fout opgetreden' }, { status: 500 })
  }
}

