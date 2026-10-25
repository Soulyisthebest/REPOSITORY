-- ==============================================================================
-- RENTIA - SCHÉMA DE BASE DE DONNÉES SUPABASE (PostgreSQL + RLS + HARDENING)
-- Version: 1.1 (Security Hardened & Production-Ready)
-- ==============================================================================

-- Activation de l'extension pgcrypto pour les UUIDs et les hashs de sécurité
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE: profiles (Profils locataires liés à Supabase Auth)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  passport_code TEXT UNIQUE NOT NULL DEFAULT ('ESP-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6))),
  trust_score INTEGER NOT NULL DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  birth_year INTEGER,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  role TEXT NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord')),
  preferred_lang TEXT NOT NULL DEFAULT 'es',
  avatar_url TEXT,
  privacy_policy_accepted_at TIMESTAMPTZ,
  privacy_policy_version TEXT DEFAULT '1.0',
  terms_accepted_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  anonymized_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index et contraintes d'unicité sur profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL AND phone <> '';

-- ==============================================================================
-- 2. TABLE: leases (Locations / Baux)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL, -- Code court à 6 caractères (ex: VAL784)
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT DEFAULT '28013',
  country TEXT NOT NULL DEFAULT 'España',
  country_code TEXT NOT NULL DEFAULT 'ES',
  flag TEXT NOT NULL DEFAULT '🇪🇸',
  property_type TEXT NOT NULL DEFAULT 'Apartment',
  rent NUMERIC(10, 2) NOT NULL CHECK (rent >= 0),
  deposit NUMERIC(10, 2) DEFAULT 0 CHECK (deposit >= 0),
  currency TEXT NOT NULL DEFAULT '€',
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  owner_name_guess TEXT NOT NULL,
  owner_contact TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'uploading', 'extracted', 'needs_review', 'pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leases_code ON public.leases(code);
CREATE INDEX IF NOT EXISTS idx_leases_user_id ON public.leases(user_id);

-- Trigger de verrouillage : Une location vérifiée ne peut plus être altérée
CREATE OR REPLACE FUNCTION prevent_verified_lease_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'verified' THEN
    RAISE EXCEPTION 'RENTIA_LOCK: Une location déjà vérifiée ne peut plus être modifiée ni supprimée.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_lock_verified_leases ON public.leases;
CREATE TRIGGER trigger_lock_verified_leases
BEFORE UPDATE OR DELETE ON public.leases
FOR EACH ROW EXECUTE FUNCTION prevent_verified_lease_change();

-- ==============================================================================
-- 3. TABLE: contracts (Fichiers documents stockés dans Supabase Storage)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Chemin dans le bucket 'contracts'
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  sha256_hash TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'analyzed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_lease ON public.contracts(lease_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user ON public.contracts(user_id);

-- ==============================================================================
-- 4. TABLE: extracted_contract_data (Données extraites par Gemini 3.7 Flash)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.extracted_contract_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raw_gemini_json JSONB NOT NULL,
  extracted_address TEXT,
  extracted_city TEXT,
  extracted_rent NUMERIC(10, 2),
  extracted_deposit NUMERIC(10, 2),
  extracted_start_date TEXT,
  extracted_end_date TEXT,
  extracted_landlord_name TEXT,
  extracted_tenant_name TEXT,
  confidence_score NUMERIC(4, 3) DEFAULT 0.95,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_contract ON public.extracted_contract_data(contract_id);

-- ==============================================================================
-- 5. TABLE: verifications (Avis propriétaires certifiés & inaltérables WORM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID UNIQUE NOT NULL REFERENCES public.leases(id) ON DELETE RESTRICT,
  tenancy_confirmed TEXT NOT NULL CHECK (tenancy_confirmed IN ('yes', 'no')),
  rent_paid_ok TEXT NOT NULL CHECK (rent_paid_ok IN ('yes', 'sometimes', 'no')),
  property_maintained TEXT NOT NULL CHECK (property_maintained IN ('yes', 'no')),
  would_recommend TEXT NOT NULL CHECK (would_recommend IN ('yes', 'no')),
  comment TEXT,
  landlord_signer_name TEXT,
  crypto_hash TEXT NOT NULL, -- Empreinte SHA-256 scellée
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_lease ON public.verifications(lease_id);

-- Trigger PostgreSQL d'immuabilité absolue (WORM) : interdiction stricte de modifier un avis
CREATE OR REPLACE FUNCTION prevent_verification_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'RENTIA_WORM_VIOLATION: Un avis propriétaire certifié et scellé ne peut être ni modifié ni altéré.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_immutable_verifications ON public.verifications;
CREATE TRIGGER trigger_immutable_verifications
BEFORE UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION prevent_verification_modification();

-- ==============================================================================
-- 6. TABLE: payments (Paiements locatifs réels)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT '€',
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'paid_on_time' CHECK (status IN ('paid_on_time', 'paid_late', 'pending', 'unpaid')),
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_lease ON public.payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

-- ==============================================================================
-- 7. TABLE: reputation_events (Journal du calcul de score)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('lease_created', 'contract_verified', 'rent_paid_on_time', 'deposit_returned_full', 'landlord_recommendation')),
  score_delta INTEGER NOT NULL,
  resulting_score INTEGER NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_user ON public.reputation_events(user_id);

-- ==============================================================================
-- 8. TABLE: audit_logs (Journal d'audit sécurisé)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 9. SÉCURITÉ ROW LEVEL SECURITY (RLS) - Isolation stricte par utilisateur
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_contract_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- POLITIQUES RLS: profiles (Données privées strictes)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- POLITIQUES RLS: leases
DROP POLICY IF EXISTS "Les locataires gèrent leurs propres baux" ON public.leases;
CREATE POLICY "Les locataires gèrent leurs propres baux"
  ON public.leases FOR ALL
  USING (auth.uid() = user_id);

-- POLITIQUES RLS: contracts
DROP POLICY IF EXISTS "Les locataires gèrent exclusivement leurs contrats" ON public.contracts;
CREATE POLICY "Les locataires gèrent exclusivement leurs contrats"
  ON public.contracts FOR ALL
  USING (auth.uid() = user_id);

-- POLITIQUES RLS: extracted_contract_data
DROP POLICY IF EXISTS "Les locataires lisent leurs données extraites" ON public.extracted_contract_data;
CREATE POLICY "Les locataires lisent leurs données extraites"
  ON public.extracted_contract_data FOR ALL
  USING (auth.uid() = user_id);

-- POLITIQUES RLS: verifications
DROP POLICY IF EXISTS "Tout le monde peut lire les attestations vérifiées publiques" ON public.verifications;
CREATE POLICY "Tout le monde peut lire les attestations vérifiées publiques"
  ON public.verifications FOR SELECT
  USING (true);

-- POLITIQUES RLS: payments
DROP POLICY IF EXISTS "Les locataires gèrent leurs paiements" ON public.payments;
CREATE POLICY "Les locataires gèrent leurs paiements"
  ON public.payments FOR ALL
  USING (auth.uid() = user_id);

-- POLITIQUES RLS: reputation_events
DROP POLICY IF EXISTS "Les locataires voient leur historique de réputation" ON public.reputation_events;
CREATE POLICY "Les locataires voient leur historique de réputation"
  ON public.reputation_events FOR SELECT
  USING (auth.uid() = user_id);

-- POLITIQUES RLS: audit_logs
DROP POLICY IF EXISTS "Les locataires voient leurs logs d'audit" ON public.audit_logs;
CREATE POLICY "Les locataires voient leurs logs d'audit"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 10. FONCTIONS SÉCURISÉES RPC POUR L'ACCÈS PROPRIÉTAIRE (Zéro exposition RLS)
-- ==============================================================================

-- Consultation sécurisée par code 6 caractères
CREATE OR REPLACE FUNCTION public.lookup_lease_by_code(p_code TEXT)
RETURNS TABLE (
  lease_id UUID, tenant_name TEXT, address TEXT, city TEXT,
  start_date TEXT, end_date TEXT, status TEXT
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT l.id, p.name, l.address, l.city, l.start_date, l.end_date, l.status
  FROM public.leases l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE l.code = UPPER(p_code) AND l.status = 'pending';
$$;

-- Validation et scellement d'attestation par code 6 caractères
CREATE OR REPLACE FUNCTION public.confirm_lease_by_code(
  p_code TEXT, p_tenancy_confirmed TEXT, p_rent_paid_ok TEXT,
  p_property_maintained TEXT, p_would_recommend TEXT, p_comment TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_lease_id UUID;
BEGIN
  SELECT id INTO v_lease_id FROM public.leases
  WHERE code = UPPER(p_code) AND status = 'pending';

  IF v_lease_id IS NULL THEN
    RAISE EXCEPTION 'Code introuvable ou location déjà confirmée.';
  END IF;

  INSERT INTO public.verifications (
    lease_id, tenancy_confirmed, rent_paid_ok, property_maintained,
    would_recommend, comment, crypto_hash
  ) VALUES (
    v_lease_id, p_tenancy_confirmed, p_rent_paid_ok, p_property_maintained,
    p_would_recommend, p_comment, encode(digest(v_lease_id::text || NOW()::text, 'sha256'), 'hex')
  );

  UPDATE public.leases
  SET status = CASE WHEN p_tenancy_confirmed = 'yes' THEN 'verified' ELSE 'rejected' END
  WHERE id = v_lease_id;

  RETURN 'ok';
END;
$$;

-- ==============================================================================
-- 11. TRIGGER AUTO-PROFILE SUR AUTH.USERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, preferred_lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_lang', 'es')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. BUCKET SUPABASE STORAGE PRIVÉ: 'contracts'
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  15728640,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Accès privé: les locataires gèrent leurs documents" ON storage.objects;
CREATE POLICY "Accès privé: les locataires gèrent leurs documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'contracts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
