'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'

interface MeetingDeleteButtonProps {
  meetingId: string
  meetingTitel: string
  canDelete: boolean
}

export default function MeetingDeleteButton({
  meetingId,
  meetingTitel,
  canDelete,
}: MeetingDeleteButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!canDelete) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId)
      if (error) throw error
      setOpen(false)
      router.push('/meetings')
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Verwijderen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meetingverslag verwijderen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je &quot;{meetingTitel}&quot; wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
            Annuleren
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Verwijderen...' : 'Verwijderen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
