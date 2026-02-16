import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import MeetingEditForm from '@/components/meetings/meeting-edit-form'
import MeetingDeleteButton from '@/components/meetings/meeting-delete-button'
import type { Meeting, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MeetingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const supabase = await createClient()
  const canManage = canEdit(user.role)

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*, creator:profiles!meetings_created_by_fkey(full_name, email)')
    .eq('id', id)
    .single()

  if (error || !meeting) {
    notFound()
  }

  const creator = (meeting as any).creator as Profile | null
  const isCreator = meeting.created_by === user.id
  const canEditMeeting = canManage || isCreator

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetingverslag</h1>
          <p className="text-muted-foreground">
            {meeting.titel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEditMeeting && (
            <a href="#meeting-bewerken">
              <Button variant="outline">Bewerken</Button>
            </a>
          )}
          <MeetingDeleteButton
            meetingId={meeting.id}
            meetingTitel={meeting.titel}
            canDelete={canEditMeeting}
          />
          <Link href="/meetings">
            <Button variant="outline">Terug naar Overzicht</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{meeting.titel}</CardTitle>
          <CardDescription>
            {new Date(meeting.datum).toLocaleDateString('nl-NL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {creator?.full_name && <> · Notulist: {creator.full_name}</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {meeting.aanwezigen && (
            <div>
              <p className="text-sm font-medium mb-1">Aanwezigen:</p>
              <p className="text-sm text-muted-foreground">{meeting.aanwezigen}</p>
            </div>
          )}

          {meeting.notities && (
            <div>
              <p className="text-sm font-medium mb-2">Notities:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {meeting.notities}
              </p>
            </div>
          )}

          {meeting.actiepunten && meeting.actiepunten.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Actiepunten:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {meeting.actiepunten.map((punt: string, idx: number) => (
                  <li key={idx}>{punt}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <a
              href={`/api/meetings/${meeting.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">Download PDF</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {canEditMeeting && (
        <div id="meeting-bewerken">
          <MeetingEditForm meeting={meeting as Meeting} />
        </div>
      )}
    </div>
  )
}
