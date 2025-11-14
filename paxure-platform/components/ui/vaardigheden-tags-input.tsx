'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { TagsInput } from '@/components/ui/tags-input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface VaardighedenTagsInputProps {
  goed: string[]
  gemiddeld: string[]
  slecht: string[]
  onChange: (goed: string[], gemiddeld: string[], slecht: string[]) => void
  suggestions?: string[]
  className?: string
}

export function VaardighedenTagsInput({
  goed,
  gemiddeld,
  slecht,
  onChange,
  suggestions = [
    'picking',
    'inpakken',
    'controle',
    'outbound',
    'transport',
    'vas',
    'reachtruck',
    'wingparentflow',
    'inbound',
    'afwijkingen',
  ],
  className,
}: VaardighedenTagsInputProps) {
  // Move tag between categories
  const moveTag = (tag: string, from: 'goed' | 'gemiddeld' | 'slecht', to: 'goed' | 'gemiddeld' | 'slecht') => {
    if (from === to) return

    const fromArray = from === 'goed' ? goed : from === 'gemiddeld' ? gemiddeld : slecht
    const toArray = to === 'goed' ? goed : to === 'gemiddeld' ? gemiddeld : slecht

    const newFrom = fromArray.filter((t) => t !== tag)
    const newTo = [...toArray, tag]

    if (from === 'goed') {
      if (to === 'gemiddeld') {
        onChange(newFrom, newTo, slecht)
      } else {
        onChange(newFrom, gemiddeld, newTo)
      }
    } else if (from === 'gemiddeld') {
      if (to === 'goed') {
        onChange(newTo, newFrom, slecht)
      } else {
        onChange(goed, newFrom, newTo)
      }
    } else {
      // from === 'slecht'
      if (to === 'goed') {
        onChange(newTo, gemiddeld, newFrom)
      } else {
        onChange(goed, newTo, newFrom)
      }
    }
  }

  // Get all tags across all categories
  const allTags = React.useMemo(() => {
    return [...goed, ...gemiddeld, ...slecht]
  }, [goed, gemiddeld, slecht])

  // Filter suggestions to exclude already assigned tags
  const availableSuggestions = React.useMemo(() => {
    return suggestions.filter((s) => !allTags.includes(s))
  }, [suggestions, allTags])

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Goed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400">Goed</CardTitle>
            <CardDescription className="text-xs">
              Vaardigheden waar deze medewerker goed in is
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagsInput
              value={goed}
              onChange={(tags) => onChange(tags, gemiddeld, slecht)}
              suggestions={availableSuggestions}
              placeholder="Voeg vaardigheid toe..."
            />
          </CardContent>
        </Card>

        {/* Gemiddeld */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-yellow-700 dark:text-yellow-400">Gemiddeld</CardTitle>
            <CardDescription className="text-xs">
              Vaardigheden waar verbetering mogelijk is
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagsInput
              value={gemiddeld}
              onChange={(tags) => onChange(goed, tags, slecht)}
              suggestions={availableSuggestions}
              placeholder="Voeg vaardigheid toe..."
            />
          </CardContent>
        </Card>

        {/* Slecht */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-700 dark:text-red-400">Slecht / Training nodig</CardTitle>
            <CardDescription className="text-xs">
              Vaardigheden die training vereisen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TagsInput
              value={slecht}
              onChange={(tags) => onChange(goed, gemiddeld, tags)}
              suggestions={availableSuggestions}
              placeholder="Voeg vaardigheid toe..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

