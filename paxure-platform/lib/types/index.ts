export type UserRole = 
  | 'admin'
  | 'business_developer'
  | 'operationeel_verantwoordelijke'
  | 'administratief_bediende'
  | 'coach'
  | 'hulpcoach'
  | 'maatwerker'

export type DocumentType = 
  | 'sop'
  | 'template'
  | 'planning'
  | 'klantflow'
  | 'opleiding'

export type ProcesstapType = 
  | 'inbound'
  | 'picking'
  | 'packing'
  | 'controle'
  | 'outbound'
  | 'vas'
  | 'afwijkingen'

export type VaardigheidScore = '0' | '1' | '2' | 'ja' | 'nee'

export type PlanningType = 'week' | 'maand'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  capaciteiten_goed: string[] | null
  capaciteiten_gemiddeld: string[] | null
  capaciteiten_slecht: string[] | null
  werkdagen_per_week: number | null
  werkdagen_regime: string | null
  werkdagen_dagen: string[] | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  document_type: DocumentType
  file_path: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  version: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Klant {
  id: string
  naam: string
  contactpersoon_naam: string | null
  contactpersoon_email: string | null
  contactpersoon_telefoon: string | null
  interne_verantwoordelijke: string | null
  productoverzicht: string | null
  orderflow_beschrijving: string | null
  verpakking_vereisten: string | null
  transport_afspraken: string | null
  afwijkingen: string | null
  seizoensinvloed: string | null
  created_at: string
  updated_at: string
}

export interface SOP {
  id: string
  title: string
  processtap: ProcesstapType | null
  doel: string | null
  toepassingsgebied: string | null
  materiaal_vereist: string[] | null
  stap_voor_stap: string | null
  kwaliteitscontrole: string | null
  afwijkingen_handling: string | null
  veiligheidsinstructies: string | null
  training_vereist: boolean
  versie: number
  document_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  goedgekeurd_door: string | null
  goedgekeurd_op: string | null
  volgende_herziening: string | null
}

export interface Opleiding {
  id: string
  taak: string
  deeltaak: string | null
  doel: string | null
  doelgroep: string | null
  voorkennis_vereist: string | null
  opleidingsmethode: string[] | null
  duur: string | null
  opleider_id: string | null
  processtap: ProcesstapType | null
  document_id: string | null
  capaciteiten_vereist: string[] | null
  created_at: string
  updated_at: string
}

export interface Vaardighedenmatrix {
  id: string
  medewerker_id: string
  orderpicken: VaardigheidScore | null
  inpakken: VaardigheidScore | null
  controle: VaardigheidScore | null
  reachtruck: VaardigheidScore | null
  vas: VaardigheidScore | null
  wingparentflow: VaardigheidScore | null
  status: string
  opmerkingen: string | null
  laatste_update: string
  aangepast_door: string | null
  bron_beoordeling: string | null
  created_at: string
  updated_at: string
}

export interface Weekplanning {
  id: string
  week_start: string
  week_einde: string
  // New structure
  maandag_pick: string[] | null
  maandag_pack: string[] | null
  maandag_controle: string[] | null
  maandag_vas: string[] | null
  maandag_coaches: string[] | null
  maandag_administratie: string[] | null
  maandag_afwezigheden: string | null
  dinsdag_pick: string[] | null
  dinsdag_pack: string[] | null
  dinsdag_controle: string[] | null
  dinsdag_vas: string[] | null
  dinsdag_coaches: string[] | null
  dinsdag_administratie: string[] | null
  dinsdag_afwezigheden: string | null
  woensdag_pick: string[] | null
  woensdag_pack: string[] | null
  woensdag_controle: string[] | null
  woensdag_vas: string[] | null
  woensdag_coaches: string[] | null
  woensdag_administratie: string[] | null
  woensdag_afwezigheden: string | null
  donderdag_pick: string[] | null
  donderdag_pack: string[] | null
  donderdag_controle: string[] | null
  donderdag_vas: string[] | null
  donderdag_coaches: string[] | null
  donderdag_administratie: string[] | null
  donderdag_afwezigheden: string | null
  vrijdag_pick: string[] | null
  vrijdag_pack: string[] | null
  vrijdag_controle: string[] | null
  vrijdag_vas: string[] | null
  vrijdag_coaches: string[] | null
  vrijdag_administratie: string[] | null
  vrijdag_afwezigheden: string | null
  // Legacy columns (for backwards compatibility during migration)
  maandag_pickers?: string[] | null
  maandag_inpakkers?: string[] | null
  maandag_outbound?: string[] | null
  maandag_transport?: string[] | null
  dinsdag_pickers?: string[] | null
  dinsdag_inpakkers?: string[] | null
  dinsdag_outbound?: string[] | null
  dinsdag_transport?: string[] | null
  woensdag_pickers?: string[] | null
  woensdag_inpakkers?: string[] | null
  woensdag_outbound?: string[] | null
  woensdag_transport?: string[] | null
  donderdag_pickers?: string[] | null
  donderdag_inpakkers?: string[] | null
  donderdag_outbound?: string[] | null
  donderdag_transport?: string[] | null
  vrijdag_pickers?: string[] | null
  vrijdag_inpakkers?: string[] | null
  vrijdag_outbound?: string[] | null
  vrijdag_transport?: string[] | null
  speciale_leveringen: string | null
  colruyt_transport: string | null
  wie_rijdt: string | null
  opvolging_check: string[] | null
  ingevuld_door: string | null
  ingevuld_op: string
  created_at: string
  updated_at: string
}

export interface Maandplanning {
  id: string
  maand: number
  jaar: number
  taakverdeling: Record<string, any> | null
  opleidingsmomenten: Record<string, any> | null
  vas_opdrachten: string | null
  speciale_taken: string | null
  to_do_opvolgpunten: string[] | null
  goedkeuring_door: string | null
  goedkeuring_op: string | null
  verantwoordelijke: string | null
  created_at: string
  updated_at: string
}

export interface Evaluatie {
  id: string
  medewerker_id: string
  coach_id: string
  evaluatie_type: string | null
  datum: string
  notities: string | null
  actiepunten: string[] | null
  volgende_afspraak: string | null
  rapport_path: string | null
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  titel: string
  datum: string
  notities: string | null
  actiepunten: string[] | null
  aanwezigen: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Notificatie {
  id: string
  user_id: string
  titel: string
  bericht: string | null
  type: string | null
  link: string | null
  gelezen: boolean
  created_at: string
}

export interface Verlof {
  id: string
  medewerker_id: string
  start_datum: string
  eind_datum: string
  type: string
  opmerking: string | null
  goedgekeurd: boolean
  goedgekeurd_door: string | null
  goedgekeurd_op: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

