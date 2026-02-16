'use client'

import { usePathname } from 'next/navigation'
import type { BreadcrumbItem } from '@/components/ui/breadcrumb'

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()
  
  if (!pathname) return []
  
  const segments = pathname.split('/').filter(Boolean)
  const items: BreadcrumbItem[] = []
  
  // Map path segments to readable labels
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    documenten: 'Documenten',
    opleidingen: 'Opleidingen',
    sops: "SOP's",
    planning: 'Planning',
    week: 'Weekplanning',
    maand: 'Maandplanning',
    afwezigheidskalender: 'Afwezigheidskalender',
    klanten: 'Klanten',
    medewerkers: 'Medewerkers',
    coaching: 'Coaching',
    meetings: 'Meetings',
    nieuw: 'Nieuw',
    upload: 'Upload',
    bewerken: 'Bewerken',
    vaardighedenmatrix: 'Vaardighedenmatrix',
  }
  
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Skip numeric IDs in breadcrumbs (they're not user-friendly)
    if (!isNaN(Number(segment)) && segment.length > 5) {
      // Likely a UUID, skip it or show generic label
      return
    }
    
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    items.push({
      label,
      href: isLast ? undefined : currentPath,
    })
  })
  
  return items
}

