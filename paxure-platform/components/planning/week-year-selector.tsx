'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getWeeksInYear } from '@/lib/utils/date'

interface WeekYearSelectorProps {
  currentWeek: number
  currentYear: number
  basePath: string
}

export default function WeekYearSelector({
  currentWeek,
  currentYear,
  basePath,
}: WeekYearSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const weeksInYear = getWeeksInYear(currentYear)
  const weeks = Array.from({ length: weeksInYear }, (_, i) => i + 1)
  
  // Generate year options (current year ± 2 years)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const handleWeekChange = (week: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', week)
    params.set('year', currentYear.toString())
    router.push(`${basePath}?${params.toString()}`)
  }

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', currentWeek.toString())
    params.set('year', year)
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentWeek.toString()} onValueChange={handleWeekChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Week" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week) => (
            <SelectItem key={week} value={week.toString()}>
              Week {week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={currentYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Jaar" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

