import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCurrentUser, canManagePlanning } from '@/lib/auth'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx-js-style'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') as 'excel' | 'pdf' | null

    if (!format || !['excel', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Ongeldig formaat. Gebruik excel of pdf' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get weekplanning with medewerker names
    const { data: planning, error: planningError } = await supabase
      .from('weekplanning')
      .select('*')
      .eq('id', id)
      .single()

    if (planningError || !planning) {
      return NextResponse.json({ error: 'Weekplanning niet gevonden' }, { status: 404 })
    }

    // Get all medewerkers for name lookup (including werkregime info)
    const { data: medewerkers } = await supabase
      .from('profiles')
      .select('id, full_name, email, werkdagen_per_week, werkdagen_regime, werkdagen_dagen')
      .in('role', ['maatwerker', 'coach', 'hulpcoach', 'admin', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'])

    const medewerkerMap = new Map(
      medewerkers?.map((m) => [m.id, m.full_name || m.email]) || []
    )

    // Helper to parse date string (YYYY-MM-DD) without timezone issues
    const parseDateLocal = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    // Helper to format date as YYYY-MM-DD
    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // Get verlof for the week - improved query to catch all overlapping verlof
    // Parse dates without timezone conversion to avoid day shifts
    const weekStartDate = parseDateLocal(planning.week_start)
    const weekEndDate = parseDateLocal(planning.week_einde)
    const weekStartStr = planning.week_start // Already in YYYY-MM-DD format
    const weekEndStr = planning.week_einde // Already in YYYY-MM-DD format
    
    // Get verlof entries that could overlap with the week
    // Strategy: Get verlof that starts before or during the week, then filter for overlap
    const { data: potentialVerlof } = await supabase
      .from('verlof')
      .select('*')
      .lte('start_datum', weekEndStr) // Starts before or during week
    
    // Also get verlof that ends during or after the week
    const { data: verlofEndingInRange } = await supabase
      .from('verlof')
      .select('*')
      .gte('eind_datum', weekStartStr) // Ends during or after week start
    
    // Combine and deduplicate, then filter for actual overlap
    const verlofMap = new Map<string, any>()
    const allPotentialVerlof = [...(potentialVerlof || []), ...(verlofEndingInRange || [])]
    
    allPotentialVerlof.forEach((v) => {
      if (!verlofMap.has(v.id)) {
        // Check if verlof actually overlaps with week: start <= weekEnd AND end >= weekStart
        if (v.start_datum <= weekEndStr && v.eind_datum >= weekStartStr) {
          verlofMap.set(v.id, v)
        }
      }
    })
    
    const verlofEntries = Array.from(verlofMap.values())

    // Helper functions for werkregime
    const formatWerkdagen = (werkdagen: number | null | undefined): string => {
      if (!werkdagen || werkdagen === 5) return ''
      return `${werkdagen}/5`
    }

    const formatWerkregimeLabel = (medewerker: any): string => {
      if (!medewerker) return ''
      
      const parts: string[] = []
      
      if (medewerker.werkdagen_per_week && medewerker.werkdagen_per_week !== 5) {
        const werkdagen = formatWerkdagen(medewerker.werkdagen_per_week)
        if (werkdagen) parts.push(werkdagen)
      }
      
      if (medewerker.werkdagen_regime) {
        parts.push(medewerker.werkdagen_regime)
      }
      
      if (medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0) {
        const dagenLabels: Record<string, string> = {
          maandag: 'Ma',
          dinsdag: 'Di',
          woensdag: 'Wo',
          donderdag: 'Do',
          vrijdag: 'Vr',
        }
        const dagenStr = medewerker.werkdagen_dagen
          .map((d: string) => dagenLabels[d.toLowerCase()] || d)
          .join(', ')
        parts.push(`(${dagenStr})`)
      }
      
      return parts.join(' ')
    }

    // Check if a medewerker works on a specific day
    const worksOnDay = (medewerker: any, date: Date): boolean => {
      if (!medewerker) return false
      
      const dayOfWeek = date.getDay()
      const dayNames: Record<number, string> = {
        1: 'maandag',
        2: 'dinsdag',
        3: 'woensdag',
        4: 'donderdag',
        5: 'vrijdag',
        0: 'zondag',
        6: 'zaterdag',
      }
      
      const currentDayName = dayNames[dayOfWeek]?.toLowerCase()
      if (!currentDayName) return false
      
      if (medewerker.werkdagen_dagen && medewerker.werkdagen_dagen.length > 0) {
        return medewerker.werkdagen_dagen.some(
          (dag: string) => dag.toLowerCase().trim() === currentDayName
        )
      }
      
      if (!medewerker.werkdagen_per_week || medewerker.werkdagen_per_week === 5) {
        return dayOfWeek >= 1 && dayOfWeek <= 5
      }
      
      return false
    }

    const getMedewerkerNames = (ids: string[] | null): string => {
      if (!ids || ids.length === 0) return ''
      return ids.map((id) => medewerkerMap.get(id) || 'Onbekend').join(', ')
    }

    // Helper to get planning data with backwards compatibility
    const getPlanningData = (day: string, role: string): string[] => {
      const newKey = `${day}_${role}` as keyof typeof planning
      let value = planning[newKey] as string[] | null | undefined
      
      // Backwards compatibility: check old column names if new ones are empty
      if ((!value || value.length === 0) && (role === 'pick' || role === 'pack')) {
        if (role === 'pick') {
          value = (planning as any)[`${day}_pickers`] || []
        } else if (role === 'pack') {
          value = (planning as any)[`${day}_inpakkers`] || []
        }
      }
      
      // Ensure we always return an array
      return Array.isArray(value) ? value : []
    }

    const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'] as const
    const roles = ['pick', 'pack', 'controle', 'vas', 'coaches', 'administratie'] as const
    const roleLabels: Record<string, string> = {
      pick: 'Pick',
      pack: 'Pack',
      controle: 'Controle',
      vas: 'VAS',
      coaches: 'Coaches',
      administratie: 'Administratie',
    }

    if (format === 'pdf') {
      // Generate PDF in portrait orientation
      const doc = new jsPDF('portrait', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const cardPadding = 8
      const cardSpacing = 10
      let yPos = margin

      // Paxure brand colors (converted to RGB for jsPDF)
      const colors = {
        primary: [119, 37, 71],      // #772547
        destructive: [210, 38, 48],   // #d22630
        accent: [218, 108, 52],       // #da6c34
        border: [230, 230, 230],      // Light gray for borders
        background: [250, 250, 250],  // Light background for cards
        text: [51, 51, 51],           // Dark text
        textLight: [102, 102, 102],  // Light text
      }

      // Helper function to add text with color (modifies yPos)
      const addText = (text: string, fontSize: number, isBold: boolean = false, x: number = margin, color: number[] = colors.text) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.setTextColor(color[0], color[1], color[2])
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - (x - margin) * 2)
        lines.forEach((line: string) => {
          if (yPos > pageHeight - margin - 10) {
            doc.addPage()
            yPos = margin
          }
          doc.text(line, x, yPos)
          yPos += fontSize * 0.5
        })
        yPos += 2
      }

      // Helper function to add text at a specific position (doesn't modify yPos)
      const addTextAt = (text: string, x: number, y: number, fontSize: number, isBold: boolean = false, color: number[] = colors.text) => {
        doc.setFontSize(fontSize)
        doc.setFont('helvetica', isBold ? 'bold' : 'normal')
        doc.setTextColor(color[0], color[1], color[2])
        const maxWidth = pageWidth - margin * 2 - (x - margin) * 2
        const lines = doc.splitTextToSize(text, maxWidth)
        let currentY = y
        lines.forEach((line: string) => {
          if (currentY > pageHeight - margin - 10) {
            doc.addPage()
            currentY = margin
          }
          doc.text(line, x, currentY)
          currentY += fontSize * 0.5
        })
        return currentY
      }

      // Helper function to draw a card (Bento-style)
      const drawCard = (x: number, y: number, width: number, height: number, color: number[] = colors.background) => {
        // Card background with rounded corners (simulated with rectangle)
        doc.setFillColor(color[0], color[1], color[2])
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2])
        doc.setLineWidth(0.5)
        doc.roundedRect(x, y, width, height, 2, 2, 'FD')
      }

      // Helper function to draw a colored badge/count
      const drawBadge = (x: number, y: number, text: string, bgColor: number[] = colors.primary) => {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        const textWidth = doc.getTextWidth(text)
        const badgeWidth = textWidth + 4
        const badgeHeight = 5
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
        doc.roundedRect(x, y - badgeHeight + 0.5, badgeWidth, badgeHeight, 1, 1, 'F')
        doc.setTextColor(255, 255, 255)
        doc.text(text, x + 2, y - 0.5)
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      }

      // Title section
      const titleY = yPos
      addText('Weekplanning', 22, true, margin, colors.primary)
      addText(
        `Week van ${new Date(planning.week_start).toLocaleDateString('nl-NL')} tot ${new Date(planning.week_einde).toLocaleDateString('nl-NL')}`,
        11,
        false,
        margin,
        colors.textLight
      )
      yPos += 8

      // Helper function to draw day header
      const drawDayHeader = (dayLabel: string, dayDateFormatted: string, startY: number): number => {
        const dayHeaderHeight = 12
        const dayHeaderBg = [245, 245, 245] // Very light gray, almost white
        drawCard(margin, startY, pageWidth - margin * 2, dayHeaderHeight, dayHeaderBg)
        // Draw title horizontally INSIDE the card
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
        // Center vertically in card: startY + (dayHeaderHeight / 2) - (fontSize / 2.5)
        doc.text(`${dayLabel} ${dayDateFormatted}`, margin + cardPadding, startY + dayHeaderHeight / 2 + 2)
        return startY + dayHeaderHeight + 5
      }

      // Process each day
      // Parse the week start date from string to avoid timezone issues
      const [startYear, startMonth, startDay] = planning.week_start.split('-').map(Number)
      
      days.forEach((day) => {
        // Get date for this day - create fresh date from original string to avoid timezone issues
        const dayIndex = days.indexOf(day)
        const dayDate = new Date(startYear, startMonth - 1, startDay + dayIndex)
        // Set time to noon to avoid any timezone edge cases
        dayDate.setHours(12, 0, 0, 0)
        const dayDateStr = formatDateLocal(dayDate)
        const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)
        // Format date for display using the correctly parsed date
        const dayDateFormatted = `${String(dayDate.getDate()).padStart(2, '0')}-${String(dayDate.getMonth() + 1).padStart(2, '0')}`

        // Check if we need a new page before starting the day
        if (yPos > pageHeight - 80) {
          doc.addPage()
          yPos = margin
        }

        // Day header card - very light background (almost white, good readability)
        const dayHeaderHeight = 12
        yPos = drawDayHeader(dayLabel, dayDateFormatted, yPos)

        // Calculate card dimensions - dynamic height based on content
        const cardWidth = (pageWidth - margin * 2 - cardSpacing) / 2
        const baseCardHeight = 25
        let cardX = margin
        let cardY = yPos

        // First pass: calculate heights for all cards
        const cardHeights: number[] = []
        roles.forEach((role) => {
          const medewerkerIds = getPlanningData(day, role)
          const count = medewerkerIds.length
          let neededHeight = baseCardHeight
          
          if (count > 0) {
            // Calculate space needed: header (12mm) + all names (4.5mm each) + extra padding for last name
            const headerSpace = 12
            const nameSpace = count * 4.5
            const padding = 8 // Extra padding to ensure last name fits comfortably
            neededHeight = headerSpace + nameSpace + padding
            // Minimum height
            neededHeight = Math.max(neededHeight, baseCardHeight)
          } else {
            // Empty card - minimum height
            neededHeight = baseCardHeight
          }
          
          cardHeights.push(neededHeight)
        })

        // Create cards for each role
        roles.forEach((role, index) => {
          if (index > 0 && index % 2 === 0) {
            cardX = margin
            // Find max height of previous row
            const prevRowHeight = Math.max(cardHeights[index - 2], cardHeights[index - 1])
            cardY += prevRowHeight + cardSpacing
            
            // Check if we need a new page before drawing the next row
            if (cardY + cardHeights[index] > pageHeight - margin - 20) {
              doc.addPage()
              yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
              cardY = yPos
              // Always start on left column when starting a new page (index % 2 === 0 means left column)
              cardX = margin
            }
          } else if (index > 0) {
            cardX = margin + cardWidth + cardSpacing
          }

          const roleLabel = roleLabels[role]
          const medewerkerIds = getPlanningData(day, role)
          const count = medewerkerIds.length
          const cardHeight = cardHeights[index]

          // Check if card fits on current page, if not start new page
          if (cardY + cardHeight > pageHeight - margin - 20) {
            doc.addPage()
            yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
            cardY = yPos
            // Always start on left column when starting a new page
            cardX = margin
            // If this is a right column card (odd index), move to right column
            if (index % 2 === 1) {
              cardX = margin + cardWidth + cardSpacing
            }
          }

          // Draw card
          drawCard(cardX, cardY, cardWidth, cardHeight)

          // Role label with count badge - ALWAYS horizontal
          const labelX = cardX + cardPadding
          const labelY = cardY + cardPadding + 4
          
          // Set font and draw title horizontally
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          const roleLabelWidth = doc.getTextWidth(roleLabel)
          
          // Draw title horizontally (single line, no wrapping)
          doc.text(roleLabel, labelX, labelY)
          
          // Count badge
          if (count > 0) {
            const badgeX = labelX + roleLabelWidth + 4
            drawBadge(badgeX, labelY, count.toString(), colors.primary)
          }

          // Medewerkers list with bullets
          const namesY = labelY + 5
          if (medewerkerIds && Array.isArray(medewerkerIds) && medewerkerIds.length > 0) {
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
            doc.setFillColor(colors.text[0], colors.text[1], colors.text[2])
            let currentY = namesY
            const maxWidth = cardWidth - cardPadding * 2 - 8
            const lineHeight = 4.5
            const maxY = cardY + cardHeight - cardPadding
            
            medewerkerIds.forEach((id: string) => {
              const name = medewerkerMap.get(id) || 'Onbekend'
              // Draw bullet point
              doc.circle(labelX + 1.5, currentY - 1.5, 0.6, 'F')
              // Draw name (split if too long)
              const nameLines = doc.splitTextToSize(name, maxWidth)
              const nameHeight = nameLines.length * lineHeight
              
              // Always draw all lines - card height is calculated to fit all names
              nameLines.forEach((line: string, lineIdx: number) => {
                doc.text(line, labelX + 5, currentY + lineIdx * lineHeight)
              })
              currentY += nameHeight
            })
          } else {
            // No medewerkers - show horizontal dash
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
            doc.text('-', labelX, namesY)
          }
        })

        // Update yPos for next section - use max height of last row
        const lastRowIndex = Math.floor((roles.length - 1) / 2)
        const lastRowHeight = roles.length % 2 === 0 
          ? Math.max(cardHeights[roles.length - 2], cardHeights[roles.length - 1])
          : cardHeights[roles.length - 1]
        yPos = cardY + lastRowHeight + cardSpacing + 5

        // Verlof section
        const verlofForDay = verlofEntries?.filter(
          (v) => v.start_datum <= dayDateStr && v.eind_datum >= dayDateStr
        ) || []

        if (verlofForDay.length > 0) {
          // Calculate actual height needed for verlof section
          // Header: cardPadding (4) + label height (9*0.5) + spacing (5) = ~13mm
          // Each entry: ~4.5mm (with potential wrapping)
          let totalVerlofHeight = 13 // Header space
          verlofForDay.forEach((verlof) => {
            const medewerkerName = medewerkerMap.get(verlof.medewerker_id) || 'Onbekend'
            const verlofType = verlof.type.charAt(0).toUpperCase() + verlof.type.slice(1)
            const verlofText = `${medewerkerName} - ${verlofType}${verlof.opmerking ? ` (${verlof.opmerking})` : ''}`
            // Estimate text lines (rough calculation)
            doc.setFontSize(8)
            const textLines = doc.splitTextToSize(verlofText, pageWidth - margin * 2 - (margin + cardPadding) - 6)
            totalVerlofHeight += Math.max(4.5, textLines.length * 4)
          })
          totalVerlofHeight += cardPadding // Bottom padding
          
          // Check if verlof section fits on current page
          if (yPos + totalVerlofHeight > pageHeight - margin - 20) {
            doc.addPage()
            yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
          }
          
          let verlofStartY = yPos
          let verlofLabelY = verlofStartY + cardPadding + 4
          const verlofLabelX = margin + cardPadding
          
          // Set font to get text width for badge positioning
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          const verlofLabelWidth = doc.getTextWidth('Verlof')
          
          // Draw card background - use soft pastel red/pink color for better readability
          const verlofBg = [255, 240, 240] // Very light pink/red tint
          drawCard(margin, verlofStartY, pageWidth - margin * 2, totalVerlofHeight, verlofBg)
          
          // Use destructive color for title text (red) but keep it readable
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(colors.destructive[0], colors.destructive[1], colors.destructive[2])
          doc.text('Verlof', verlofLabelX, verlofLabelY)
          const verlofCount = verlofForDay.length
          drawBadge(verlofLabelX + verlofLabelWidth + 4, verlofLabelY, verlofCount.toString(), colors.destructive)
          
          let verlofTextY = verlofLabelY + 5
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          doc.setFillColor(colors.destructive[0], colors.destructive[1], colors.destructive[2])
          
          verlofForDay.forEach((verlof) => {
            const medewerkerName = medewerkerMap.get(verlof.medewerker_id) || 'Onbekend'
            const verlofType = verlof.type.charAt(0).toUpperCase() + verlof.type.slice(1)
            const verlofText = `${medewerkerName} - ${verlofType}${verlof.opmerking ? ` (${verlof.opmerking})` : ''}`
            
            // Estimate height for this entry
            const textLines = doc.splitTextToSize(verlofText, pageWidth - margin * 2 - verlofLabelX - 6)
            const entryHeight = Math.max(4.5, textLines.length * 4)
            
            // Check if entry fits, if not start new page
            if (verlofTextY + entryHeight > pageHeight - margin - 20) {
              doc.addPage()
              yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
              verlofStartY = yPos
              verlofLabelY = verlofStartY + cardPadding + 4
              verlofTextY = verlofLabelY + 5
              
              // Recalculate remaining height for new page
              let remainingHeight = 13 // Header space
              const currentIndex = verlofForDay.indexOf(verlof)
              verlofForDay.slice(currentIndex).forEach((v) => {
                const name = medewerkerMap.get(v.medewerker_id) || 'Onbekend'
                const type = v.type.charAt(0).toUpperCase() + v.type.slice(1)
                const text = `${name} - ${type}${v.opmerking ? ` (${v.opmerking})` : ''}`
                const lines = doc.splitTextToSize(text, pageWidth - margin * 2 - verlofLabelX - 6)
                remainingHeight += Math.max(4.5, lines.length * 4)
              })
              remainingHeight += cardPadding
              
              // Redraw card background and header on new page
              const verlofBg = [255, 240, 240] // Very light pink/red tint
              drawCard(margin, verlofStartY, pageWidth - margin * 2, remainingHeight, verlofBg)
              // Redraw title
              doc.setFontSize(9)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(colors.destructive[0], colors.destructive[1], colors.destructive[2])
              doc.text('Verlof', verlofLabelX, verlofLabelY)
              drawBadge(verlofLabelX + verlofLabelWidth + 4, verlofLabelY, verlofCount.toString(), colors.destructive)
            }
            
            // Draw bullet
            doc.circle(verlofLabelX + 2, verlofTextY - 1.5, 0.6, 'F')
            // Draw text
            textLines.forEach((line: string, idx: number) => {
              doc.text(line, verlofLabelX + 5, verlofTextY + idx * 4)
            })
            verlofTextY += entryHeight
          })
          yPos = verlofTextY + cardPadding
        }

        // Werkregime section
        // Use the same dayDate that was created above for consistency
        const werkregimeMedewerkers = medewerkers?.filter((m) => {
          const worksToday = worksOnDay(m, dayDate)
          const hasWerkregime = !!(m.werkdagen_per_week && m.werkdagen_per_week !== 5) || 
                               !!(m.werkdagen_regime) || 
                               !!(m.werkdagen_dagen && m.werkdagen_dagen.length > 0)
          return !worksToday && hasWerkregime
        }) || []

        if (werkregimeMedewerkers.length > 0) {
          // Calculate card height based on content
          const headerSpace = 12
          const nameSpace = werkregimeMedewerkers.length * 4.5
          const padding = 8
          const werkregimeCardHeight = headerSpace + nameSpace + padding
          
          // Check if werkregime section fits on current page
          if (yPos + werkregimeCardHeight > pageHeight - margin - 20) {
            doc.addPage()
            yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
          }
          
          const werkregimeStartY = yPos
          const werkregimeLabelY = werkregimeStartY + cardPadding + 4
          const werkregimeLabelX = margin + cardPadding
          
          // Use light background (almost white) instead of dark
          const werkregimeBg = [250, 248, 245] // Very light beige/orange tint
          drawCard(margin, werkregimeStartY, pageWidth - margin * 2, werkregimeCardHeight, werkregimeBg)
          
          // Set font to get text width for badge positioning
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2])
          const werkregimeLabelWidth = doc.getTextWidth('Werkregime (Vrije dag)')
          
          // Draw title horizontally INSIDE the card
          doc.text('Werkregime (Vrije dag)', werkregimeLabelX, werkregimeLabelY)
          const werkregimeCount = werkregimeMedewerkers.length
          drawBadge(werkregimeLabelX + werkregimeLabelWidth + 4, werkregimeLabelY, werkregimeCount.toString(), colors.accent)
          
          let werkregimeTextY = werkregimeLabelY + 5
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])
          doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2])
          
          werkregimeMedewerkers.forEach((medewerker) => {
            const medewerkerName = medewerker.full_name || medewerker.email || 'Onbekend'
            const werkregimeLabel = formatWerkregimeLabel(medewerker)
            const werkregimeText = `${medewerkerName} - ${werkregimeLabel}`
            // Draw bullet
            doc.circle(werkregimeLabelX + 2, werkregimeTextY - 1.5, 0.6, 'F')
            // Draw text
            const textLines = doc.splitTextToSize(werkregimeText, pageWidth - margin * 2 - werkregimeLabelX - 6)
            textLines.forEach((line: string, idx: number) => {
              doc.text(line, werkregimeLabelX + 5, werkregimeTextY + idx * 4)
            })
            werkregimeTextY += Math.max(4, textLines.length * 4)
          })
          yPos = werkregimeStartY + werkregimeCardHeight + cardSpacing
        }

        // Afwezigheden section
        const afwezigheden = planning[`${day}_afwezigheden` as keyof typeof planning] as string
        if (afwezigheden) {
          // Check if afwezigheden section fits on current page
          if (yPos + 30 > pageHeight - margin - 20) {
            doc.addPage()
            yPos = drawDayHeader(dayLabel, dayDateFormatted, margin)
          }
          
          const afwezighedenLabelY = yPos + cardPadding + 4
          drawCard(margin, yPos, pageWidth - margin * 2, 12, colors.background)
          addTextAt('Afwezigheden & Opmerkingen', margin + cardPadding, afwezighedenLabelY, 9, true, colors.text)
          const afwezighedenTextY = addTextAt(afwezigheden, margin + cardPadding + 2, afwezighedenLabelY + 5, 8, false, colors.text)
          yPos = afwezighedenTextY + cardPadding
        }

        yPos += 5
      })

      // Extra info section
      if (planning.speciale_leveringen || planning.colruyt_transport || planning.wie_rijdt) {
        if (yPos > pageHeight - 60) {
          doc.addPage()
          yPos = margin
        }
        
        yPos += 5
        const extraCardHeight = 40
        drawCard(margin, yPos, pageWidth - margin * 2, extraCardHeight, [colors.primary[0] * 0.05, colors.primary[1] * 0.05, colors.primary[2] * 0.05])
        addText('Bijzonderheden', 14, true, margin + cardPadding, colors.primary)
        
        if (planning.speciale_leveringen) {
          addText(`Speciale leveringen: ${planning.speciale_leveringen}`, 10, false, margin + cardPadding + 2, colors.text)
        }
        if (planning.colruyt_transport) {
          addText(`Colruyt transport: ${planning.colruyt_transport}`, 10, false, margin + cardPadding + 2, colors.text)
        }
        if (planning.wie_rijdt) {
          addText(`Wie rijdt: ${planning.wie_rijdt}`, 10, false, margin + cardPadding + 2, colors.text)
        }
      }

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="weekplanning-${planning.week_start}.pdf"`,
        },
      })
    } else {
      // Generate Excel file using xlsx library
      const workbook = XLSX.utils.book_new()
      
      // Prepare data for Excel sheet
      const excelData: any[][] = []
      
      // Track day ranges for styling
      interface DayRange {
        dayIndex: number
        startRow: number
        endRow: number
        color: string
      }
      const dayRanges: DayRange[] = []
      
      // Soft pastel colors for each day (RGB values)
      const dayColors = [
        { r: 230, g: 240, b: 255 }, // Maandag - lichtblauw
        { r: 240, g: 255, b: 240 }, // Dinsdag - lichtgroen
        { r: 255, g: 250, b: 230 }, // Woensdag - lichtgeel
        { r: 255, g: 240, b: 250 }, // Donderdag - lichtroze
        { r: 250, g: 240, b: 255 }, // Vrijdag - lichtpaars
      ]
      
      // Helper to convert RGB to hex
      const rgbToHex = (r: number, g: number, b: number): string => {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
      }
      
      // Helper to format date for display (DD-MM-YYYY)
      const formatDateForDisplay = (dateStr: string): string => {
        const [year, month, day] = dateStr.split('-')
        return `${day}-${month}-${year}`
      }

      // Header
      excelData.push(['Weekplanning', `Week van ${formatDateForDisplay(planning.week_start)} tot ${formatDateForDisplay(planning.week_einde)}`])
      excelData.push([])
      let currentRow = 2 // Start after header rows

      // Parse the week start date from string to avoid timezone issues
      const [excelStartYear, excelStartMonth, excelStartDay] = planning.week_start.split('-').map(Number)
      
      days.forEach((day, dayIndex) => {
        const dayStartRow = currentRow
        // Get date for this day - create fresh date from original string to avoid timezone issues
        const dayDate = new Date(excelStartYear, excelStartMonth - 1, excelStartDay + dayIndex)
        // Set time to noon to avoid any timezone edge cases
        dayDate.setHours(12, 0, 0, 0)
        const dayDateStr = formatDateLocal(dayDate)
        const dayDateDisplay = formatDateForDisplay(dayDateStr)
        
        excelData.push([`${day.charAt(0).toUpperCase() + day.slice(1)} ${dayDateDisplay}`])
        currentRow++
        excelData.push(['Rol', 'Medewerkers'])
        currentRow++
        
        roles.forEach((role) => {
          const roleLabel = roleLabels[role]
          const medewerkerIds = getPlanningData(day, role)
          const count = medewerkerIds.length
          
          // Add role label with count
          if (count > 0) {
            excelData.push([`${roleLabel} (${count})`, ''])
            currentRow++
            // List each medewerker on a separate row
            medewerkerIds.forEach((id) => {
              const name = medewerkerMap.get(id) || 'Onbekend'
              excelData.push(['', name])
              currentRow++
            })
          } else {
            // No medewerkers for this role
            excelData.push([roleLabel, '-'])
            currentRow++
          }
        })

        // Verlof for this day
        const verlofForDay = verlofEntries?.filter(
          (v) => v.start_datum <= dayDateStr && v.eind_datum >= dayDateStr
        ) || []

        if (verlofForDay.length > 0) {
          excelData.push([`Verlof (${verlofForDay.length})`, ''])
          currentRow++
          verlofForDay.forEach((verlof) => {
            const medewerkerName = medewerkerMap.get(verlof.medewerker_id) || 'Onbekend'
            const verlofType = verlof.type.charAt(0).toUpperCase() + verlof.type.slice(1)
            excelData.push(['', `${medewerkerName} - ${verlofType}${verlof.opmerking ? ` (${verlof.opmerking})` : ''}`])
            currentRow++
          })
        }

        // Werkregime (medewerkers who don't work on this day)
        // Only show werkregime when they are NOT working today
        // Create a fresh date object for this specific day from the original string to avoid timezone issues
        const [startYear, startMonth, startDay] = planning.week_start.split('-').map(Number)
        const checkDate = new Date(startYear, startMonth - 1, startDay + dayIndex)
        // Set time to noon to avoid any timezone edge cases
        checkDate.setHours(12, 0, 0, 0)
        
        const werkregimeMedewerkers = medewerkers?.filter((m) => {
          const worksToday = worksOnDay(m, checkDate)
          const hasWerkregime = !!(m.werkdagen_per_week && m.werkdagen_per_week !== 5) || 
                               !!(m.werkdagen_regime) || 
                               !!(m.werkdagen_dagen && m.werkdagen_dagen.length > 0)
          // Only include if they don't work today AND have a werkregime
          return !worksToday && hasWerkregime
        }) || []

        if (werkregimeMedewerkers.length > 0) {
          excelData.push([`Werkregime (Vrije dag) (${werkregimeMedewerkers.length})`, ''])
          currentRow++
          werkregimeMedewerkers.forEach((medewerker) => {
            const medewerkerName = medewerker.full_name || medewerker.email || 'Onbekend'
            const werkregimeLabel = formatWerkregimeLabel(medewerker)
            excelData.push(['', `${medewerkerName} - ${werkregimeLabel}`])
            currentRow++
          })
        }

        const afwezigheden = planning[`${day}_afwezigheden` as keyof typeof planning] as string
        if (afwezigheden) {
          excelData.push(['Afwezigheden & Opmerkingen', afwezigheden])
          currentRow++
        }
        excelData.push([])
        currentRow++
        
        // Store day range for styling
        const dayColor = dayColors[dayIndex]
        dayRanges.push({
          dayIndex,
          startRow: dayStartRow,
          endRow: currentRow - 1, // Before the empty row
          color: rgbToHex(dayColor.r, dayColor.g, dayColor.b)
        })
      })

      // Add extra info if present
      if (planning.speciale_leveringen || planning.colruyt_transport || planning.wie_rijdt) {
        excelData.push([])
        excelData.push(['Bijzonderheden'])
        if (planning.speciale_leveringen) {
          excelData.push(['Speciale leveringen', planning.speciale_leveringen])
        }
        if (planning.colruyt_transport) {
          excelData.push(['Colruyt transport', planning.colruyt_transport])
        }
        if (planning.wie_rijdt) {
          excelData.push(['Wie rijdt', planning.wie_rijdt])
        }
      }

      // Create worksheet from data
      const worksheet = XLSX.utils.aoa_to_sheet(excelData)
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Rol column
        { wch: 50 }, // Medewerkers column
      ]
      
      // Apply styling to each day section
      dayRanges.forEach((dayRange) => {
        const dayColor = dayColors[dayRange.dayIndex]
        const headerColor = rgbToHex(
          Math.max(0, dayColor.r - 30),
          Math.max(0, dayColor.g - 30),
          Math.max(0, dayColor.b - 30)
        )
        
        // Apply background color and borders to all cells in the day range
        for (let row = dayRange.startRow; row <= dayRange.endRow; row++) {
          const colA = XLSX.utils.encode_cell({ r: row, c: 0 })
          const colB = XLSX.utils.encode_cell({ r: row, c: 1 })
          
          // Ensure cells exist
          if (!worksheet[colA]) {
            worksheet[colA] = { t: 's', v: '' }
          }
          if (!worksheet[colB]) {
            worksheet[colB] = { t: 's', v: '' }
          }
          
          // Determine if this is the header row
          const isHeaderRow = row === dayRange.startRow
          const fillColor = isHeaderRow ? headerColor : dayRange.color
          
          // Base style with borders
          const baseStyle = {
            fill: {
              fgColor: { rgb: fillColor }
            },
            border: {
              top: { style: 'thin', color: { rgb: '999999' } },
              bottom: { style: 'thin', color: { rgb: '999999' } },
              left: { style: 'thin', color: { rgb: '999999' } },
              right: { style: 'thin', color: { rgb: '999999' } }
            }
          }
          
          // Apply style to column A
          worksheet[colA].s = isHeaderRow 
            ? { ...baseStyle, font: { bold: true, sz: 12 } }
            : baseStyle
          
          // Apply style to column B
          worksheet[colB].s = isHeaderRow
            ? { ...baseStyle, font: { bold: true, sz: 12 } }
            : baseStyle
        }
      })
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekplanning')

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="weekplanning-${planning.week_start}.xlsx"`,
        },
      })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Onverwachte fout opgetreden bij het exporteren' },
      { status: 500 }
    )
  }
}

