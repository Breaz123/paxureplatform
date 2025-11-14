-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM (
  'business_developer',
  'operationeel_verantwoordelijke',
  'coach',
  'hulpcoach',
  'maatwerker'
);

CREATE TYPE document_type AS ENUM (
  'sop',
  'template',
  'planning',
  'klantflow',
  'opleiding'
);

CREATE TYPE processtap_type AS ENUM (
  'inbound',
  'picking',
  'packing',
  'controle',
  'outbound',
  'vas',
  'afwijkingen'
);

CREATE TYPE vaardigheid_score AS ENUM ('0', '1', '2', 'ja', 'nee');

CREATE TYPE planning_type AS ENUM ('week', 'maand');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'maatwerker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  document_type document_type NOT NULL,
  file_path TEXT, -- Path in Supabase Storage
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klanten (Customers) table
CREATE TABLE public.klanten (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  naam TEXT NOT NULL,
  contactpersoon_naam TEXT,
  contactpersoon_email TEXT,
  contactpersoon_telefoon TEXT,
  interne_verantwoordelijke UUID REFERENCES public.profiles(id),
  productoverzicht TEXT,
  orderflow_beschrijving TEXT,
  verpakking_vereisten TEXT,
  transport_afspraken TEXT,
  afwijkingen TEXT,
  seizoensinvloed TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOPs table
CREATE TABLE public.sops (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  processtap processtap_type,
  doel TEXT,
  toepassingsgebied TEXT,
  materiaal_vereist TEXT[],
  stap_voor_stap TEXT,
  kwaliteitscontrole TEXT,
  afwijkingen_handling TEXT,
  veiligheidsinstructies TEXT,
  training_vereist BOOLEAN DEFAULT false,
  versie INTEGER DEFAULT 1,
  document_id UUID REFERENCES public.documents(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  goedgekeurd_door UUID REFERENCES public.profiles(id),
  goedgekeurd_op TIMESTAMPTZ,
  volgende_herziening TIMESTAMPTZ
);

-- Opleidingen table
CREATE TABLE public.opleidingen (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  taak TEXT NOT NULL,
  deeltaak TEXT,
  doel TEXT,
  doelgroep TEXT,
  voorkennis_vereist TEXT,
  opleidingsmethode TEXT[],
  duur TEXT,
  opleider_id UUID REFERENCES public.profiles(id),
  processtap processtap_type,
  document_id UUID REFERENCES public.documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaardighedenmatrix table
CREATE TABLE public.vaardighedenmatrix (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medewerker_id UUID REFERENCES public.profiles(id) NOT NULL,
  orderpicken vaardigheid_score,
  inpakken vaardigheid_score,
  controle vaardigheid_score,
  reachtruck vaardigheid_score,
  vas vaardigheid_score,
  wingparentflow vaardigheid_score,
  status TEXT DEFAULT 'actief',
  opmerkingen TEXT,
  laatste_update TIMESTAMPTZ DEFAULT NOW(),
  aangepast_door UUID REFERENCES public.profiles(id),
  bron_beoordeling TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opleiding registraties (welke medewerker heeft welke opleiding voltooid)
CREATE TABLE public.opleiding_registraties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opleiding_id UUID REFERENCES public.opleidingen(id) NOT NULL,
  medewerker_id UUID REFERENCES public.profiles(id) NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  voltooid_op TIMESTAMPTZ DEFAULT NOW(),
  score vaardigheid_score,
  opmerkingen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opleiding_id, medewerker_id)
);

-- Weekplanning table
CREATE TABLE public.weekplanning (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start DATE NOT NULL, -- Maandag van de week
  week_einde DATE NOT NULL, -- Vrijdag van de week
  maandag_pickers TEXT[],
  maandag_inpakkers TEXT[],
  maandag_controle TEXT[],
  maandag_outbound TEXT[],
  maandag_transport TEXT[],
  maandag_vas TEXT[],
  maandag_afwezigheden TEXT,
  dinsdag_pickers TEXT[],
  dinsdag_inpakkers TEXT[],
  dinsdag_controle TEXT[],
  dinsdag_outbound TEXT[],
  dinsdag_transport TEXT[],
  dinsdag_vas TEXT[],
  dinsdag_afwezigheden TEXT,
  woensdag_pickers TEXT[],
  woensdag_inpakkers TEXT[],
  woensdag_controle TEXT[],
  woensdag_outbound TEXT[],
  woensdag_transport TEXT[],
  woensdag_vas TEXT[],
  woensdag_afwezigheden TEXT,
  donderdag_pickers TEXT[],
  donderdag_inpakkers TEXT[],
  donderdag_controle TEXT[],
  donderdag_outbound TEXT[],
  donderdag_transport TEXT[],
  donderdag_vas TEXT[],
  donderdag_afwezigheden TEXT,
  vrijdag_pickers TEXT[],
  vrijdag_inpakkers TEXT[],
  vrijdag_controle TEXT[],
  vrijdag_outbound TEXT[],
  vrijdag_transport TEXT[],
  vrijdag_vas TEXT[],
  vrijdag_afwezigheden TEXT,
  speciale_leveringen TEXT,
  colruyt_transport TEXT,
  wie_rijdt TEXT,
  opvolging_check TEXT[],
  ingevuld_door UUID REFERENCES public.profiles(id),
  ingevuld_op TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maandplanning table
CREATE TABLE public.maandplanning (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  maand INTEGER NOT NULL,
  jaar INTEGER NOT NULL,
  taakverdeling JSONB, -- Flexible structure for weekly task distribution
  opleidingsmomenten JSONB,
  vas_opdrachten TEXT,
  speciale_taken TEXT,
  to_do_opvolgpunten TEXT[],
  goedkeuring_door UUID REFERENCES public.profiles(id),
  goedkeuring_op TIMESTAMPTZ,
  verantwoordelijke UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(maand, jaar)
);

-- Evaluaties / Coaching table
CREATE TABLE public.evaluaties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medewerker_id UUID REFERENCES public.profiles(id) NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  evaluatie_type TEXT, -- '1-op-1', 'opvolging', 'vaardigheden', etc.
  datum TIMESTAMPTZ NOT NULL,
  notities TEXT,
  actiepunten TEXT[],
  volgende_afspraak TIMESTAMPTZ,
  rapport_path TEXT, -- Path to PDF in storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaties table
CREATE TABLE public.notificaties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  titel TEXT NOT NULL,
  bericht TEXT,
  type TEXT, -- 'planning', 'document', 'opleiding', etc.
  link TEXT,
  gelezen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klantflow afwijkingen table
CREATE TABLE public.klantflow_afwijkingen (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  klant_id UUID REFERENCES public.klanten(id) NOT NULL,
  beschrijving TEXT NOT NULL,
  datum TIMESTAMPTZ NOT NULL,
  opgelost BOOLEAN DEFAULT false,
  opgelost_op TIMESTAMPTZ,
  opgelost_door UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_documents_type ON public.documents(document_type);
CREATE INDEX idx_vaardighedenmatrix_medewerker ON public.vaardighedenmatrix(medewerker_id);
CREATE INDEX idx_weekplanning_week_start ON public.weekplanning(week_start);
CREATE INDEX idx_maandplanning_maand_jaar ON public.maandplanning(maand, jaar);
CREATE INDEX idx_notificaties_user_gelezen ON public.notificaties(user_id, gelezen);
CREATE INDEX idx_opleiding_registraties_medewerker ON public.opleiding_registraties(medewerker_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klanten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opleidingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaardighedenmatrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opleiding_registraties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekplanning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maandplanning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.klantflow_afwijkingen ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined per role)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can view documents (refine per role if needed)
CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only coaches and above can insert/update documents
CREATE POLICY "Coaches can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Similar policies for other tables...
-- (Add more specific policies based on role requirements)

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_klanten_updated_at BEFORE UPDATE ON public.klanten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON public.sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opleidingen_updated_at BEFORE UPDATE ON public.opleidingen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vaardighedenmatrix_updated_at BEFORE UPDATE ON public.vaardighedenmatrix
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekplanning_updated_at BEFORE UPDATE ON public.weekplanning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maandplanning_updated_at BEFORE UPDATE ON public.maandplanning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluaties_updated_at BEFORE UPDATE ON public.evaluaties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_klantflow_afwijkingen_updated_at BEFORE UPDATE ON public.klantflow_afwijkingen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

