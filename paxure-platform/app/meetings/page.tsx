import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser, canEdit } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import MeetingDeleteButton from '@/components/meetings/meeting-delete-button'
import type { Meeting } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MeetingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const canManage = canEdit(user.role)

  const { data: meetings } = await supabase
    .from('meetings')
    .select('*, creator:profiles!meetings_created_by_fkey(full_name)')
    .order('datum', { ascending: false })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground">
            Beheer meetingverslagen en exporteer ze naar PDF
          </p>
        </div>
        {canManage && (
          <Link href="/meetings/nieuw">
            <Button>Nieuw Meetingverslag</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {meetings && meetings.length > 0 ? (
          meetings.map((meeting: any) => {
            const canEditMeeting = canManage || meeting.created_by === user.id
            return (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{meeting.titel}</CardTitle>
                      <CardDescription>
                        {new Date(meeting.datum).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {(meeting as any).creator?.full_name && (
                          <> · Notulist: {(meeting as any).creator.full_name}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {meeting.notities && (
                      <div>
                        <p className="text-sm font-medium mb-1">Notities:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                          {meeting.notities}
                        </p>
                      </div>
                    )}
                    {meeting.actiepunten && meeting.actiepunten.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Actiepunten:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {meeting.actiepunten.slice(0, 3).map((punt: string, idx: number) => (
                            <li key={idx}>{punt}</li>
                          ))}
                          {meeting.actiepunten.length > 3 && (
                            <li className="text-muted-foreground/70">… en {meeting.actiepunten.length - 3} meer</li>
                          )}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <a
                        href={`/api/meetings/${meeting.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">Download PDF</Button>
                      </a>
                      <Link href={`/meetings/${meeting.id}`}>
                        <Button variant="outline">Bekijk Details</Button>
                      </Link>
                      {canEditMeeting && (
                        <>
                          <Link href={`/meetings/${meeting.id}#meeting-bewerken`}>
                            <Button variant="outline">Bewerken</Button>
                          </Link>
                          <MeetingDeleteButton
                            meetingId={meeting.id}
                            meetingTitel={meeting.titel}
                            canDelete={true}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nog geen meetingverslagen. Maak er een aan om te beginnen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
