'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
  maxTags?: number
}

export function TagsInput({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Voeg tags toe...',
  className,
  maxTags,
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState('')
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return suggestions.filter((s) => !value.includes(s))
    return suggestions.filter(
      (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
    )
  }, [inputValue, suggestions, value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const addTag = (tag: string) => {
    if (maxTags && value.length >= maxTags) return
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2 min-h-[42px] p-2 border rounded-md focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 p-0 h-auto"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="border rounded-md shadow-lg bg-popover p-1 max-h-[200px] overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {inputValue.trim() && !suggestions.includes(inputValue.trim()) && !value.includes(inputValue.trim()) && (
        <button
          type="button"
          onClick={() => addTag(inputValue.trim())}
          className="text-sm text-primary hover:underline"
        >
          + "{inputValue.trim()}" toevoegen
        </button>
      )}
    </div>
  )
}

