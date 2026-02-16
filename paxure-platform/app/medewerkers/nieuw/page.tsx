'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'
import { VaardighedenTagsInput } from '@/components/ui/vaardigheden-tags-input'

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'business_developer', label: 'Business Developer' },
  { value: 'operationeel_verantwoordelijke', label: 'Operationeel Verantwoordelijke' },
  { value: 'administratief_bediende', label: 'Administratief Bediende' },
  { value: 'coach', label: 'Coach' },
  { value: 'hulpcoach', label: 'Hulpcoach' },
  { value: 'maatwerker', label: 'Maatwerker' },
]

const capaciteitSuggesties = [
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
]

export default function NieuweMedewerkerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: '' as UserRole | '',
    password: '',
    capaciteiten_goed: [] as string[],
    capaciteiten_gemiddeld: [] as string[],
    capaciteiten_slecht: [] as string[],
    werkdagen_per_week: 5.0,
    werkdagen_regime: '',
    werkdagen_dagen: [] as string[],
  })

  const dagen = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag']
  
  const regimeOpties = [
    { value: 'Ma-Vr', label: 'Ma-Vr (5 dagen)', dagen: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'] },
    { value: 'Ma-Do', label: 'Ma-Do (4 dagen)', dagen: ['maandag', 'dinsdag', 'woensdag', 'donderdag'] },
    { value: 'Ma-Wo', label: 'Ma-Wo (3 dagen)', dagen: ['maandag', 'dinsdag', 'woensdag'] },
    { value: 'Ma-Di', label: 'Ma-Di (2 dagen)', dagen: ['maandag', 'dinsdag'] },
    { value: 'Ma', label: 'Ma (1 dag)', dagen: ['maandag'] },
    { value: 'Di-Vr', label: 'Di-Vr (4 dagen)', dagen: ['dinsdag', 'woensdag', 'donderdag', 'vrijdag'] },
    { value: 'Di-Do', label: 'Di-Do (3 dagen)', dagen: ['dinsdag', 'woensdag', 'donderdag'] },
    { value: 'Wo-Vr', label: 'Wo-Vr (3 dagen)', dagen: ['woensdag', 'donderdag', 'vrijdag'] },
    { value: 'Do-Vr', label: 'Do-Vr (2 dagen)', dagen: ['donderdag', 'vrijdag'] },
    { value: 'custom', label: 'Aangepast', dagen: [] },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.email || !formData.password) {
      setError('Email en wachtwoord zijn verplicht')
      setSubmitting(false)
      return
    }

    try {
      // Create medewerker via API route (needs admin access)
      const response = await fetch('/api/medewerkers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role || 'maatwerker',
          capaciteiten_goed: formData.capaciteiten_goed,
          capaciteiten_gemiddeld: formData.capaciteiten_gemiddeld,
          capaciteiten_slecht: formData.capaciteiten_slecht,
          werkdagen_per_week: formData.werkdagen_per_week,
          werkdagen_regime: formData.werkdagen_regime || null,
          werkdagen_dagen: (formData.werkdagen_dagen || []).length > 0 ? (formData.werkdagen_dagen || []) : null,
        }),
      })

      const data = await response.json()

      // Log the full response for debugging
      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (!response.ok) {
        let errorMessage = data.error || 'Medewerker aanmaken mislukt'
        
        // Log the original error for debugging
        console.error('API Error:', {
          status: response.status,
          error: errorMessage,
          fullData: data
        })
        
        // Provide user-friendly error messages
        if (response.status === 401) {
          errorMessage = 'Je bent niet ingelogd. Log opnieuw in.'
        } else if (response.status === 403) {
          // Check for specific error types
          if (errorMessage.includes('RLS') || errorMessage.includes('Row Level Security') || errorMessage.includes('toegang tot je gebruikersprofiel')) {
            errorMessage = 'Toegang geweigerd: Er is een probleem met de database rechten. Neem contact op met een beheerder om de RLS policies te controleren.'
          } else if (errorMessage.includes('rechten om medewerkers aan te maken')) {
            errorMessage = errorMessage // Keep the original message
          } else {
            errorMessage = 'Je hebt geen rechten om medewerkers aan te maken. Alleen coaches en hogere rollen kunnen medewerkers toevoegen.'
          }
        } else if (response.status === 500) {
          // For 500 errors, show the actual error message from the API
          // Only show generic RLS message if it's specifically about RLS
          if (errorMessage.includes('RLS probleem') || errorMessage.includes('infinite recursion') || errorMessage.includes('Row Level Security')) {
            errorMessage = errorMessage // Keep the detailed RLS error
          } else if (errorMessage.includes('Service role key')) {
            errorMessage = 'Server configuratie fout. Neem contact op met een beheerder.'
          } else {
            // Show the actual error message from API
            errorMessage = errorMessage
          }
        } else if (errorMessage.includes('User not allowed') || errorMessage.includes('permission denied')) {
          // Only show RLS message if it's actually an RLS error
          if (errorMessage.includes('infinite recursion') || errorMessage.includes('RLS')) {
            errorMessage = 'Toegang geweigerd: Er is een RLS (Row Level Security) probleem. Neem contact op met een beheerder.'
          } else {
            errorMessage = errorMessage // Show the actual error
          }
        }
        
        throw new Error(errorMessage)
      }

      router.push('/medewerkers')
      router.refresh()
    } catch (err) {
      console.error('Error creating medewerker:', err)
      setError(err instanceof Error ? err.message : 'Medewerker aanmaken mislukt')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nieuwe Medewerker</h1>
        <p className="text-muted-foreground">
          Voeg een nieuwe medewerker toe aan het systeem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medewerker Details</CardTitle>
          <CardDescription>
            Vul de gegevens van de medewerker in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="medewerker@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Volledige Naam</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Jan Jansen"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimaal 6 tekens"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecteer rol (standaard: Maatwerker)" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Capaciteiten / Vaardigheden</Label>
              <VaardighedenTagsInput
                goed={formData.capaciteiten_goed}
                gemiddeld={formData.capaciteiten_gemiddeld}
                slecht={formData.capaciteiten_slecht}
                onChange={(goed, gemiddeld, slecht) => 
                  setFormData({ ...formData, capaciteiten_goed: goed, capaciteiten_gemiddeld: gemiddeld, capaciteiten_slecht: slecht })
                }
                suggestions={capaciteitSuggesties}
              />
              <p className="text-sm text-muted-foreground">
                Categoriseer vaardigheden per niveau. Dit helpt om te bepalen wie welke opleiding nodig heeft.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="werkdagen_per_week">Werkdagen per Week</Label>
                <Select
                  value={(() => {
                    const val = formData.werkdagen_per_week ?? 5.0
                    // Normalize to match SelectItem values exactly
                    if (val === 5) return '5.0'
                    if (val === 4) return '4.0'
                    if (val === 3) return '3.0'
                    if (val === 2.5) return '2.5'
                    if (val === 2) return '2.0'
                    if (val === 1) return '1.0'
                    return val.toString()
                  })()}
                  onValueChange={(value) => {
                    const newWerkdagen = parseFloat(value)
                    const huidigeDagen = formData.werkdagen_dagen || []
                    setFormData({ 
                      ...formData, 
                      werkdagen_per_week: newWerkdagen,
                      // Reset regime and days if the number doesn't match
                      werkdagen_regime: huidigeDagen.length === newWerkdagen ? formData.werkdagen_regime : '',
                      werkdagen_dagen: huidigeDagen.length === newWerkdagen ? huidigeDagen : [],
                    })
                  }}
                >
                  <SelectTrigger id="werkdagen_per_week">
                    <SelectValue placeholder="Selecteer werkdagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5.0">5/5 (Voltijd)</SelectItem>
                    <SelectItem value="4.0">4/5</SelectItem>
                    <SelectItem value="3.0">3/5</SelectItem>
                    <SelectItem value="2.5">2.5/5</SelectItem>
                    <SelectItem value="2.0">2/5</SelectItem>
                    <SelectItem value="1.0">1/5</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Aantal werkdagen per week dat deze medewerker werkt
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="werkdagen_regime">Regime</Label>
                <Select
                  value={formData.werkdagen_regime}
                  onValueChange={(value) => {
                    const selectedRegime = regimeOpties.find(r => r.value === value)
                    if (selectedRegime && selectedRegime.value !== 'custom') {
                      setFormData({ 
                        ...formData, 
                        werkdagen_regime: value,
                        werkdagen_dagen: selectedRegime.dagen,
                        werkdagen_per_week: selectedRegime.dagen.length,
                      })
                    } else {
                      setFormData({ 
                        ...formData, 
                        werkdagen_regime: value,
                      })
                    }
                  }}
                >
                  <SelectTrigger id="werkdagen_regime">
                    <SelectValue placeholder="Selecteer regime" />
                  </SelectTrigger>
                  <SelectContent>
                    {regimeOpties.map((regime) => (
                      <SelectItem key={regime.value} value={regime.value}>
                        {regime.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecteer een standaard regime of kies "Aangepast" om dagen handmatig te selecteren
                </p>
              </div>

              <div className="space-y-2">
                <Label>Werkdagen</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dagen.map((dag) => {
                    const werkdagenDagen = formData.werkdagen_dagen || []
                    const isSelected = werkdagenDagen.includes(dag)
                    const maxDagen = formData.werkdagen_per_week
                    const huidigeAantal = werkdagenDagen.length
                    
                    return (
                      <div key={dag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dag-${dag}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Check if we can add more days
                              if (huidigeAantal >= maxDagen) {
                                setError(`Je kunt maximaal ${maxDagen} dag(en) selecteren.`)
                                return
                              }
                              setFormData({
                                ...formData,
                                werkdagen_dagen: [...werkdagenDagen, dag],
                                werkdagen_regime: formData.werkdagen_regime === 'custom' ? 'custom' : '',
                              })
                            } else {
                              setFormData({
                                ...formData,
                                werkdagen_dagen: werkdagenDagen.filter(d => d !== dag),
                                werkdagen_regime: formData.werkdagen_regime === 'custom' ? 'custom' : '',
                              })
                            }
                            setError(null)
                          }}
                          disabled={!isSelected && huidigeAantal >= maxDagen}
                        />
                        <Label
                          htmlFor={`dag-${dag}`}
                          className="text-sm font-normal cursor-pointer capitalize"
                        >
                          {dag}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  Geselecteerd: {(formData.werkdagen_dagen || []).length} van {formData.werkdagen_per_week} dag(en)
                  {(formData.werkdagen_dagen || []).length !== formData.werkdagen_per_week && (
                    <span className="text-destructive ml-2">
                      (Selecteer {formData.werkdagen_per_week - (formData.werkdagen_dagen || []).length} dag(en) meer)
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Annuleren
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Aanmaken...' : 'Medewerker Aanmaken'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

