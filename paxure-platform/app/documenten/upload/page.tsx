'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DocumentType } from '@/lib/types'

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: 'sop', label: 'SOP' },
  { value: 'template', label: 'Template' },
  { value: 'planning', label: 'Planning' },
  { value: 'klantflow', label: 'Klantflow' },
  { value: 'opleiding', label: 'Opleiding' },
]

export default function UploadDocumentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: '' as DocumentType | '',
    file: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.file || !formData.title || !formData.document_type) {
      setError('Vul alle verplichte velden in')
      setLoading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', formData.file)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('document_type', formData.document_type)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload mislukt')
      }

      router.push('/documenten')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload mislukt')
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Document Uploaden</h1>
        <p className="text-muted-foreground">
          Upload een nieuw document naar de bibliotheek
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
          <CardDescription>Vul de gegevens van het document in</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Bijv. SOP Orderpicken"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type *</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) => setFormData({ ...formData, document_type: value as DocumentType })}
                required
              >
                <SelectTrigger id="document_type">
                  <SelectValue placeholder="Selecteer document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionele beschrijving van het document"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Bestand *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setFormData({ ...formData, file })
                  }
                }}
                required
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <p className="text-sm text-muted-foreground">
                Ondersteunde formaten: PDF, Word, Excel, Text
              </p>
              {formData.file && (
                <p className="text-sm text-muted-foreground">
                  Geselecteerd: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Uploaden...' : 'Document Uploaden'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

