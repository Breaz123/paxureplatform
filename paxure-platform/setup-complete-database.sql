-- Complete Database Setup voor Paxure Platform
-- Voer dit script uit in Supabase SQL Editor
-- Dit script maakt alle tabellen, types, functies, triggers en policies aan

-- ============================================
-- PART 1: Extensions en Types
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'business_developer',
    'operationeel_verantwoordelijke',
    'coach',
    'hulpcoach',
    'maatwerker'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'sop',
    'template',
    'planning',
    'klantflow',
    'opleiding'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE processtap_type AS ENUM (
    'inbound',
    'picking',
    'packing',
    'controle',
    'outbound',
    'vas',
    'afwijkingen'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE vaardigheid_score AS ENUM ('0', '1', '2', 'ja', 'nee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE planning_type AS ENUM ('week', 'maand');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PART 2: Tabellen
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'maatwerker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  document_type document_type NOT NULL,
  file_path TEXT,
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
CREATE TABLE IF NOT EXISTS public.klanten (
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
CREATE TABLE IF NOT EXISTS public.sops (
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
CREATE TABLE IF NOT EXISTS public.opleidingen (
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
CREATE TABLE IF NOT EXISTS public.vaardighedenmatrix (
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

-- Opleiding registraties
CREATE TABLE IF NOT EXISTS public.opleiding_registraties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opleiding_id UUID REFERENCES public.opleidingen(id) NOT NULL,
  medewerker_id UUID REFERENCES public.profiles(id) NOT NULL,
  geregistreerd_door UUID REFERENCES public.profiles(id),
  geregistreerd_op TIMESTAMPTZ DEFAULT NOW(),
  score vaardigheid_score,
  opmerkingen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opleiding_id, medewerker_id)
);

-- Weekplanning table
CREATE TABLE IF NOT EXISTS public.weekplanning (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_einde DATE NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.maandplanning (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  maand INTEGER NOT NULL,
  jaar INTEGER NOT NULL,
  taakverdeling JSONB,
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
CREATE TABLE IF NOT EXISTS public.evaluaties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medewerker_id UUID REFERENCES public.profiles(id) NOT NULL,
  coach_id UUID REFERENCES public.profiles(id) NOT NULL,
  evaluatie_type TEXT,
  datum TIMESTAMPTZ NOT NULL,
  notities TEXT,
  actiepunten TEXT[],
  volgende_afspraak TIMESTAMPTZ,
  rapport_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaties table
CREATE TABLE IF NOT EXISTS public.notificaties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  titel TEXT NOT NULL,
  bericht TEXT,
  type TEXT,
  link TEXT,
  gelezen BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Klantflow afwijkingen table
CREATE TABLE IF NOT EXISTS public.klantflow_afwijkingen (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  klant_id UUID REFERENCES public.klanten(id) NOT NULL,
  titel TEXT NOT NULL,
  beschrijving TEXT,
  prioriteit TEXT DEFAULT 'normaal',
  opgelost BOOLEAN DEFAULT false,
  opgelost_op TIMESTAMPTZ,
  opgelost_door UUID REFERENCES public.profiles(id),
  geregistreerd_door UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: Indexes voor performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_vaardighedenmatrix_medewerker ON public.vaardighedenmatrix(medewerker_id);
CREATE INDEX IF NOT EXISTS idx_weekplanning_week_start ON public.weekplanning(week_start);
CREATE INDEX IF NOT EXISTS idx_maandplanning_maand_jaar ON public.maandplanning(maand, jaar);
CREATE INDEX IF NOT EXISTS idx_notificaties_user_gelezen ON public.notificaties(user_id, gelezen);
CREATE INDEX IF NOT EXISTS idx_opleiding_registraties_medewerker ON public.opleiding_registraties(medewerker_id);
CREATE INDEX IF NOT EXISTS idx_evaluaties_medewerker ON public.evaluaties(medewerker_id);
CREATE INDEX IF NOT EXISTS idx_evaluaties_coach ON public.evaluaties(coach_id);
CREATE INDEX IF NOT EXISTS idx_klantflow_afwijkingen_klant ON public.klantflow_afwijkingen(klant_id);

-- ============================================
-- PART 4: Row Level Security (RLS)
-- ============================================

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

-- ============================================
-- PART 5: RLS Policies
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
CREATE POLICY "All authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Documents policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage documents" ON public.documents;
CREATE POLICY "Coaches can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Klanten policies
DROP POLICY IF EXISTS "Authenticated users can view klanten" ON public.klanten;
CREATE POLICY "Authenticated users can view klanten" ON public.klanten
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage klanten" ON public.klanten;
CREATE POLICY "Coaches can manage klanten" ON public.klanten
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- SOPs policies
DROP POLICY IF EXISTS "Authenticated users can view sops" ON public.sops;
CREATE POLICY "Authenticated users can view sops" ON public.sops
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage sops" ON public.sops;
CREATE POLICY "Coaches can manage sops" ON public.sops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Opleidingen policies
DROP POLICY IF EXISTS "Authenticated users can view opleidingen" ON public.opleidingen;
CREATE POLICY "Authenticated users can view opleidingen" ON public.opleidingen
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage opleidingen" ON public.opleidingen;
CREATE POLICY "Coaches can manage opleidingen" ON public.opleidingen
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Vaardighedenmatrix policies
DROP POLICY IF EXISTS "Authenticated users can view vaardighedenmatrix" ON public.vaardighedenmatrix;
CREATE POLICY "Authenticated users can view vaardighedenmatrix" ON public.vaardighedenmatrix
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage vaardighedenmatrix" ON public.vaardighedenmatrix;
CREATE POLICY "Coaches can manage vaardighedenmatrix" ON public.vaardighedenmatrix
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Opleiding registraties policies
DROP POLICY IF EXISTS "Users can view own registraties" ON public.opleiding_registraties;
CREATE POLICY "Users can view own registraties" ON public.opleiding_registraties
  FOR SELECT USING (
    medewerker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage registraties" ON public.opleiding_registraties;
CREATE POLICY "Coaches can manage registraties" ON public.opleiding_registraties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Weekplanning policies
DROP POLICY IF EXISTS "Authenticated users can view weekplanning" ON public.weekplanning;
CREATE POLICY "Authenticated users can view weekplanning" ON public.weekplanning
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage weekplanning" ON public.weekplanning;
CREATE POLICY "Coaches can manage weekplanning" ON public.weekplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Maandplanning policies
DROP POLICY IF EXISTS "Authenticated users can view maandplanning" ON public.maandplanning;
CREATE POLICY "Authenticated users can view maandplanning" ON public.maandplanning
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage maandplanning" ON public.maandplanning;
CREATE POLICY "Coaches can manage maandplanning" ON public.maandplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Evaluaties policies
DROP POLICY IF EXISTS "Users can view own evaluaties" ON public.evaluaties;
CREATE POLICY "Users can view own evaluaties" ON public.evaluaties
  FOR SELECT USING (
    medewerker_id = auth.uid() OR
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage evaluaties" ON public.evaluaties;
CREATE POLICY "Coaches can manage evaluaties" ON public.evaluaties
  FOR ALL USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Notificaties policies
DROP POLICY IF EXISTS "Users can view own notificaties" ON public.notificaties;
CREATE POLICY "Users can view own notificaties" ON public.notificaties
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notificaties" ON public.notificaties;
CREATE POLICY "Users can update own notificaties" ON public.notificaties
  FOR UPDATE USING (user_id = auth.uid());

-- Klantflow afwijkingen policies
DROP POLICY IF EXISTS "Authenticated users can view afwijkingen" ON public.klantflow_afwijkingen;
CREATE POLICY "Authenticated users can view afwijkingen" ON public.klantflow_afwijkingen
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage afwijkingen" ON public.klantflow_afwijkingen;
CREATE POLICY "Coaches can manage afwijkingen" ON public.klantflow_afwijkingen
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- ============================================
-- PART 6: Functions en Triggers
-- ============================================

-- Function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_klanten_updated_at ON public.klanten;
CREATE TRIGGER update_klanten_updated_at BEFORE UPDATE ON public.klanten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sops_updated_at ON public.sops;
CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON public.sops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opleidingen_updated_at ON public.opleidingen;
CREATE TRIGGER update_opleidingen_updated_at BEFORE UPDATE ON public.opleidingen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaardighedenmatrix_updated_at ON public.vaardighedenmatrix;
CREATE TRIGGER update_vaardighedenmatrix_updated_at BEFORE UPDATE ON public.vaardighedenmatrix
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekplanning_updated_at ON public.weekplanning;
CREATE TRIGGER update_weekplanning_updated_at BEFORE UPDATE ON public.weekplanning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maandplanning_updated_at ON public.maandplanning;
CREATE TRIGGER update_maandplanning_updated_at BEFORE UPDATE ON public.maandplanning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_evaluaties_updated_at ON public.evaluaties;
CREATE TRIGGER update_evaluaties_updated_at BEFORE UPDATE ON public.evaluaties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_klantflow_afwijkingen_updated_at ON public.klantflow_afwijkingen;
CREATE TRIGGER update_klantflow_afwijkingen_updated_at BEFORE UPDATE ON public.klantflow_afwijkingen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- EINDE VAN DATABASE SETUP
-- ============================================
-- 
-- Volgende stap: Voer storage-policies.sql uit in SQL Editor
-- om de storage bucket policies te configureren
-- 
-- Daarna: Maak een profiel aan voor je gebruiker (zie create-first-user.sql)

