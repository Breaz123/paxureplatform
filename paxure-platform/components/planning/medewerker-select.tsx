'use client'

import * as React from 'react'
import { X, Search, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Profile, Verlof } from '@/lib/types'

interface MedewerkerSelectProps {
  value: string[] // Array of medewerker IDs
  onChange: (ids: string[]) => void
  medewerkers: Profile[]
  placeholder?: string
  className?: string
  maxSelections?: number
  verlofData?: Verlof[] // Verlof entries for the current date range
  currentDate?: Date // Date to check verlof for (defaults to today)
}

export function MedewerkerSelect({
  value,
  onChange,
  medewerkers,
  placeholder = 'Typ om te zoeken...',
  className,
  maxSelections,
  verlofData = [],
  currentDate = new Date(),
}: MedewerkerSelectProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  const selectedMedewerkers = React.useMemo(() => {
    return medewerkers.filter((m) => value.includes(m.id))
  }, [medewerkers, value])

  const filteredMedewerkers = React.useMemo(() => {
    const available = medewerkers.filter((m) => !value.includes(m.id))
    if (!inputValue.trim()) return available
    const searchLower = inputValue.toLowerCase()
    return available.filter(
      (m) =>
        (m.full_name?.toLowerCase().includes(searchLower) ||
          m.email?.toLowerCase().includes(searchLower))
    )
  }, [inputValue, medewerkers, value])

  // Reset highlighted index when filtered list changes
  React.useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredMedewerkers.length, inputValue])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightedIndex >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.children
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredMedewerkers.length > 0) {
        setShowSuggestions(true)
        setHighlightedIndex((prev) => 
          prev < filteredMedewerkers.length - 1 ? prev + 1 : prev
        )
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredMedewerkers.length > 0) {
        setShowSuggestions(true)
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredMedewerkers.length) {
        addMedewerker(filteredMedewerkers[highlightedIndex].id)
      } else if (filteredMedewerkers.length > 0) {
        addMedewerker(filteredMedewerkers[0].id)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
    }
  }

  const addMedewerker = (id: string) => {
    if (maxSelections && value.length >= maxSelections) return
    if (id && !value.includes(id)) {
      onChange([...value, id])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const removeMedewerker = (id: string) => {
    onChange(value.filter((selectedId) => selectedId !== id))
  }

  const getMedewerkerName = (id: string) => {
    const medewerker = medewerkers.find((m) => m.id === id)
    return medewerker?.full_name || medewerker?.email || 'Onbekend'
  }

  const formatWerkdagen = (werkdagen: number | null | undefined): string | null => {
    if (!werkdagen || werkdagen === 5) return null
    return `${werkdagen}/5`
  }

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Check if medewerker has verlof on the current date
  const hasVerlof = (medewerkerId: string): boolean => {
    if (!verlofData || verlofData.length === 0) return false
    const checkDate = formatDateLocal(currentDate)
    return verlofData.some(
      (verlof) =>
        verlof.medewerker_id === medewerkerId &&
        verlof.start_datum <= checkDate &&
        verlof.eind_datum >= checkDate
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring bg-background">
        {selectedMedewerkers.map((medewerker) => {
          const hasVerlofOnDate = hasVerlof(medewerker.id)
          const werkdagenLabel = formatWerkdagen(medewerker.werkdagen_per_week)
          return (
            <Badge
              key={medewerker.id}
              variant="secondary"
              className={cn(
                "flex items-center gap-1",
                hasVerlofOnDate && "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300"
              )}
            >
              {hasVerlofOnDate && <Calendar className="h-3 w-3" />}
              {medewerker.full_name || medewerker.email}
              {werkdagenLabel && (
                <span className="ml-1 text-xs opacity-75">({werkdagenLabel})</span>
              )}
              <button
                type="button"
                onClick={() => removeMedewerker(medewerker.id)}
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )
        })}
        <div className="relative flex-1 min-w-[120px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
              setHighlightedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setShowSuggestions(true)
              setHighlightedIndex(-1)
            }}
            onBlur={() => {
              // Delay to allow click on suggestion
              setTimeout(() => {
                setShowSuggestions(false)
                setHighlightedIndex(-1)
              }, 200)
            }}
            placeholder={value.length === 0 ? placeholder : ''}
            className="!pl-11 pr-2 border-0 focus-visible:ring-0 p-0 h-8 bg-transparent placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {showSuggestions && filteredMedewerkers.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="border rounded-md shadow-lg bg-popover p-1 max-h-[200px] overflow-y-auto z-10"
        >
          {filteredMedewerkers.map((medewerker, index) => {
            const hasVerlofOnDate = hasVerlof(medewerker.id)
            const werkdagenLabel = formatWerkdagen(medewerker.werkdagen_per_week)
            return (
              <button
                key={medewerker.id}
                type="button"
                onClick={() => addMedewerker(medewerker.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-sm transition-colors flex items-center gap-2",
                  highlightedIndex === index
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50 hover:text-accent-foreground",
                  hasVerlofOnDate && "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20"
                )}
              >
                {hasVerlofOnDate && <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                <span className={cn(hasVerlofOnDate && "font-medium")}>
                  {medewerker.full_name || medewerker.email}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {werkdagenLabel && (
                    <span className="text-xs text-muted-foreground">
                      {werkdagenLabel}
                    </span>
                  )}
                  {hasVerlofOnDate && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400">
                      Verlof
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {inputValue.trim() && filteredMedewerkers.length === 0 && (
        <p className="text-sm text-muted-foreground px-2">
          Geen medewerkers gevonden voor "{inputValue}"
        </p>
      )}
    </div>
  )
}

