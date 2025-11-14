'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { Klant, Profile } from '@/lib/types'

export default function KlantBewerkenPage() {
  const router = useRouter()
  const params = useParams()
  const klantId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [klant, setKlant] = useState<Klant | null>(null)
  const [verantwoordelijken, setVerantwoordelijken] = useState<Profile[]>([])

  const [formData, setFormData] = useState({
    naam: '',
    contactpersoon_naam: '',
    contactpersoon_email: '',
    contactpersoon_telefoon: '',
    interne_verantwoordelijke: '',
    productoverzicht: '',
    orderflow_beschrijving: '',
    verpakking_vereisten: '',
    transport_afspraken: '',
    afwijkingen: '',
    seizoensinvloed: '',
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Load klant
        const { data: klantData, error: klantError } = await supabase
          .from('klanten')
          .select('*')
          .eq('id', klantId)
          .single()

        if (klantError || !klantData) {
          setError('Klant niet gevonden')
          setLoading(false)
          return
        }

        setKlant(klantData)
        setFormData({
          naam: klantData.naam || '',
          contactpersoon_naam: klantData.contactpersoon_naam || '',
          contactpersoon_email: klantData.contactpersoon_email || '',
          contactpersoon_telefoon: klantData.contactpersoon_telefoon || '',
          interne_verantwoordelijke: klantData.interne_verantwoordelijke || '',
          productoverzicht: klantData.productoverzicht || '',
          orderflow_beschrijving: klantData.orderflow_beschrijving || '',
          verpakking_vereisten: klantData.verpakking_vereisten || '',
          transport_afspraken: klantData.transport_afspraken || '',
          afwijkingen: klantData.afwijkingen || '',
          seizoensinvloed: klantData.seizoensinvloed || '',
        })

        // Load verantwoordelijken
        const { data: verantwoordelijkenData, error: verantwoordelijkenError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer'])
          .order('full_name')

        if (!verantwoordelijkenError && verantwoordelijkenData) {
          setVerantwoordelijken(verantwoordelijkenData)
        }
      } catch (err) {
        setError('Fout bij laden van gegevens')
      } finally {
        setLoading(false)
      }
    }

    if (klantId) {
      loadData()
    }
  }, [klantId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!formData.naam) {
      setError('Klantnaam is verplicht')
      setSubmitting(false)
      return
    }

    try {
      const { error: updateError } = await supabase
        .from('klanten')
        .update({
          naam: formData.naam,
          contactpersoon_naam: formData.contactpersoon_naam || null,
          contactpersoon_email: formData.contactpersoon_email || null,
          contactpersoon_telefoon: formData.contactpersoon_telefoon || null,
          interne_verantwoordelijke: formData.interne_verantwoordelijke || null,
          productoverzicht: formData.productoverzicht || null,
          orderflow_beschrijving: formData.orderflow_beschrijving || null,
          verpakking_vereisten: formData.verpakking_vereisten || null,
          transport_afspraken: formData.transport_afspraken || null,
          afwijkingen: formData.afwijkingen || null,
          seizoensinvloed: formData.seizoensinvloed || null,
        })
        .eq('id', klantId)

      if (updateError) {
        throw updateError
      }

      router.push(`/klanten/${klantId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Klant bijwerken mislukt')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (!klant) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Klant niet gevonden</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Klant Bewerken</h1>
        <p className="text-muted-foreground">
          Bewerk de klantgegevens
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Klant Details</CardTitle>
          <CardDescription>Pas de gegevens van de klant aan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="naam">Klantnaam *</Label>
              <Input
                id="naam"
                value={formData.naam}
                onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
                placeholder="Bijv. Klant X"
                required
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactpersoon_naam">Contactpersoon Naam</Label>
                <Input
                  id="contactpersoon_naam"
                  value={formData.contactpersoon_naam}
                  onChange={(e) => setFormData({ ...formData, contactpersoon_naam: e.target.value })}
                  placeholder="Naam van contactpersoon"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactpersoon_email">Contactpersoon Email</Label>
                <Input
                  id="contactpersoon_email"
                  type="email"
                  value={formData.contactpersoon_email}
                  onChange={(e) => setFormData({ ...formData, contactpersoon_email: e.target.value })}
                  placeholder="email@voorbeeld.nl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactpersoon_telefoon">Contactpersoon Telefoon</Label>
                <Input
                  id="contactpersoon_telefoon"
                  type="tel"
                  value={formData.contactpersoon_telefoon}
                  onChange={(e) => setFormData({ ...formData, contactpersoon_telefoon: e.target.value })}
                  placeholder="+32 XXX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interne_verantwoordelijke">Interne Verantwoordelijke</Label>
                <Select
                  value={formData.interne_verantwoordelijke}
                  onValueChange={(value) => setFormData({ ...formData, interne_verantwoordelijke: value })}
                >
                  <SelectTrigger id="interne_verantwoordelijke">
                    <SelectValue placeholder="Selecteer verantwoordelijke (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen</SelectItem>
                    {verantwoordelijken.map((verantwoordelijke) => (
                      <SelectItem key={verantwoordelijke.id} value={verantwoordelijke.id}>
                        {verantwoordelijke.full_name || verantwoordelijke.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productoverzicht">Productoverzicht</Label>
              <Textarea
                id="productoverzicht"
                value={formData.productoverzicht}
                onChange={(e) => setFormData({ ...formData, productoverzicht: e.target.value })}
                placeholder="Beschrijf het productoverzicht van deze klant"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderflow_beschrijving">Orderflow Beschrijving</Label>
              <Textarea
                id="orderflow_beschrijving"
                value={formData.orderflow_beschrijving}
                onChange={(e) => setFormData({ ...formData, orderflow_beschrijving: e.target.value })}
                placeholder="Beschrijf de orderflow voor deze klant"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verpakking_vereisten">Verpakking Vereisten</Label>
              <Textarea
                id="verpakking_vereisten"
                value={formData.verpakking_vereisten}
                onChange={(e) => setFormData({ ...formData, verpakking_vereisten: e.target.value })}
                placeholder="Speciale verpakkingseisen of instructies"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport_afspraken">Transport Afspraken</Label>
              <Textarea
                id="transport_afspraken"
                value={formData.transport_afspraken}
                onChange={(e) => setFormData({ ...formData, transport_afspraken: e.target.value })}
                placeholder="Transportafspraken en levermomenten"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="afwijkingen">Afwijkingen</Label>
              <Textarea
                id="afwijkingen"
                value={formData.afwijkingen}
                onChange={(e) => setFormData({ ...formData, afwijkingen: e.target.value })}
                placeholder="Bekende afwijkingen of bijzonderheden"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seizoensinvloed">Seizoensinvloed</Label>
              <Textarea
                id="seizoensinvloed"
                value={formData.seizoensinvloed}
                onChange={(e) => setFormData({ ...formData, seizoensinvloed: e.target.value })}
                placeholder="Seizoensgebonden variaties of pieken"
                rows={2}
              />
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
                {submitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

