import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canManageDocuments } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Document, DocumentType } from '@/lib/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const documentTypeLabels: Record<DocumentType, string> = {
  sop: 'SOP',
  template: 'Template',
  planning: 'Planning',
  klantflow: 'Klantflow',
  opleiding: 'Opleiding',
}

export default async function DocumentenPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string }>
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const supabase = await createClient()
  const canEdit = canManageDocuments(user.role)

  let query = supabase
    .from('documents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (params.type) {
    query = query.eq('document_type', params.type)
  }

  if (params.search) {
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: documents } = await query

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentbibliotheek</h1>
          <p className="text-muted-foreground">
            Toegang tot alle SOP's, templates, planningen en documenten
          </p>
        </div>
        {canEdit && (
          <Link href="/documenten/upload">
            <Button>Document Uploaden</Button>
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        <Link href="/documenten">
          <Button variant={!params.type ? 'default' : 'outline'}>
            Alle
          </Button>
        </Link>
        <Link href="/documenten?type=sop">
          <Button variant={params.type === 'sop' ? 'default' : 'outline'}>
            SOP's
          </Button>
        </Link>
        <Link href="/documenten?type=template">
          <Button variant={params.type === 'template' ? 'default' : 'outline'}>
            Templates
          </Button>
        </Link>
        <Link href="/documenten?type=planning">
          <Button variant={params.type === 'planning' ? 'default' : 'outline'}>
            Planningen
          </Button>
        </Link>
        <Link href="/documenten?type=klantflow">
          <Button variant={params.type === 'klantflow' ? 'default' : 'outline'}>
            Klantflows
          </Button>
        </Link>
        <Link href="/documenten?type=opleiding">
          <Button variant={params.type === 'opleiding' ? 'default' : 'outline'}>
            Opleidingen
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <form method="get" className="flex gap-2">
          <Input
            name="search"
            placeholder="Zoek in documenten..."
            defaultValue={params.search}
            className="max-w-sm"
          />
          {params.type && (
            <input type="hidden" name="type" value={params.type} />
          )}
          <Button type="submit">Zoeken</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents && documents.length > 0 ? (
          documents.map((doc: Document) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <Badge variant="secondary">
                    {documentTypeLabels[doc.document_type]}
                  </Badge>
                </div>
                {doc.description && (
                  <CardDescription className="line-clamp-2">
                    {doc.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {doc.file_path && (
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full">
                        Download
                      </Button>
                    </a>
                  )}
                  {doc.document_type === 'sop' && (
                    <Link href={`/sops/${doc.id}`}>
                      <Button variant="outline" className="w-full">
                        Bekijk SOP
                      </Button>
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Versie {doc.version} • {new Date(doc.created_at).toLocaleDateString('nl-NL')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Geen documenten gevonden</p>
          </div>
        )}
      </div>
    </div>
  )
}

