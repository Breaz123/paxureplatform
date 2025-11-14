'use client'

import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MaandSelectorProps {
  currentMaand: number
  currentJaar: number
}

const maandNamen = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
]

export default function MaandSelector({ currentMaand, currentJaar }: MaandSelectorProps) {
  const router = useRouter()

  const handleMaandChange = (maand: string) => {
    const params = new URLSearchParams()
    params.set('maand', maand)
    params.set('jaar', currentJaar.toString())
    router.push(`/planning/maand?${params.toString()}`)
  }

  const handleJaarChange = (jaar: string) => {
    const params = new URLSearchParams()
    params.set('maand', currentMaand.toString())
    params.set('jaar', jaar)
    router.push(`/planning/maand?${params.toString()}`)
  }

  // Generate year options (current year ± 2 years)
  const currentYear = new Date().getFullYear()
  const jaren = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <div className="flex gap-2 items-center">
      <Select value={currentMaand.toString()} onValueChange={handleMaandChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {maandNamen.map((naam, index) => (
            <SelectItem key={index + 1} value={(index + 1).toString()}>
              {naam}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={currentJaar.toString()} onValueChange={handleJaarChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {jaren.map((jaar) => (
            <SelectItem key={jaar} value={jaar.toString()}>
              {jaar}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

