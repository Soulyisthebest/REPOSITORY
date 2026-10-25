-- ==============================================================================
-- RENTIA FASE 1: EXTENSIÓN Y NORMALIZACIÓN DEL MARKETPLACE BIDIRECCIONAL
-- Compatible con profiles, listings, leases y matching existentes
-- ==============================================================================

-- 1. Catálogo de tipos de propiedad (Sección 19.1)
CREATE TABLE IF NOT EXISTS public.property_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label_es TEXT NOT NULL,
  label_en TEXT NOT NULL,
  label_fr TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.property_types (code, label_es, label_en, label_fr)
VALUES 
  ('apartment', 'Piso / Apartamento', 'Apartment', 'Appartement'),
  ('studio', 'Estudio', 'Studio', 'Studio'),
  ('house', 'Casa / Chalet', 'House', 'Maison'),
  ('room', 'Habitación / Compartido', 'Room / Shared', 'Chambre / Colocation')
ON CONFLICT (code) DO NOTHING;

-- 2. Asegurar campos en public.profiles para auditoría y roles (Incluyendo rol admin - Sección 2.5)
DO $$
BEGIN
  -- Intentar relajar el constraint de role para incluir 'admin'
  BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_role;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('tenant', 'landlord', 'admin'));
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deleted')),
  ADD COLUMN IF NOT EXISTS location_permission_granted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Tabla: tenant_profiles (Ficha única 1:1 por inquilino - Sección 3.1 & 19.1)
CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 18 AND age <= 110),
  monthly_income NUMERIC(10, 2) NOT NULL DEFAULT 0,
  has_payslips BOOLEAN NOT NULL DEFAULT false,
  employment_type TEXT NOT NULL DEFAULT 'indefinido' CHECK (employment_type IN ('indefinido', 'temporal', 'autonomo', 'estudiante', 'funcionario', 'jubilado', 'otro')),
  occupants_count INTEGER NOT NULL DEFAULT 1 CHECK (occupants_count >= 1),
  has_children BOOLEAN NOT NULL DEFAULT false,
  has_pets BOOLEAN NOT NULL DEFAULT false,
  pet_details TEXT,
  is_smoker BOOLEAN NOT NULL DEFAULT false,
  desired_move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  max_budget NUMERIC(10, 2) NOT NULL DEFAULT 1000 CHECK (max_budget > 0),
  desired_contract_duration TEXT NOT NULL DEFAULT 'long_term' CHECK (desired_contract_duration IN ('long_term', 'temporal')),
  has_guarantor BOOLEAN NOT NULL DEFAULT false,
  previous_landlord_reference TEXT,
  income_to_rent_ratio NUMERIC(5, 2) DEFAULT 0, -- Calculado automáticamente: (monthly_income / max_budget)
  bio VARCHAR(300),
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_profiles_user ON public.tenant_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_profiles_active ON public.tenant_profiles(is_active) WHERE deleted_at IS NULL;

-- 4. Tabla: tenant_photos (Mínimo 3 fotos controladas por backend - Sección 3.1 & 19.1)
CREATE TABLE IF NOT EXISTS public.tenant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_profile_id UUID NOT NULL REFERENCES public.tenant_profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_photos_profile ON public.tenant_photos(tenant_profile_id);

-- 5. Tabla: tenant_search_locations (Hasta 10 zonas por inquilino con radio km - Sección 5 & 19.1)
CREATE TABLE IF NOT EXISTS public.tenant_search_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_profile_id UUID NOT NULL REFERENCES public.tenant_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  radius_km NUMERIC(5, 1) NOT NULL DEFAULT 10 CHECK (radius_km >= 1 AND radius_km <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_locations_profile ON public.tenant_search_locations(tenant_profile_id);

-- 6. Tabla: landlord_profiles (Sección 19.1)
CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  is_agency BOOLEAN NOT NULL DEFAULT false,
  agency_cif TEXT,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Extensión de listings para soportar verificación de titularidad y coordenadas exactas
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS address_exact TEXT, -- Privado: no se revela hasta el match
  ADD COLUMN IF NOT EXISTS ownership_document_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS is_seed_data BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_listings_geo ON public.listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_verif_status ON public.listings(verification_status);

-- 8. Tabla: listing_photos (Mínimo 10 fotos controladas por backend - Sección 3.2 & 19.1)
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  room_category TEXT CHECK (room_category IN ('living_room', 'kitchen', 'bathroom', 'bedroom', 'exterior', 'entrance', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_photos_listing ON public.listing_photos(listing_id);

-- 9. Tabla: identity_verifications (Sección 4.1 & 19.1)
CREATE TABLE IF NOT EXISTS public.identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_type TEXT DEFAULT 'dni' CHECK (document_type IN ('dni', 'nie', 'passport')),
  extracted_name TEXT,
  extracted_dob DATE,
  extracted_doc_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9.1 Tabla: property_ownership_verifications (Verificación de titularidad de la propiedad - Sección 2.6)
CREATE TABLE IF NOT EXISTS public.property_ownership_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'nota_simple' CHECK (document_type IN ('nota_simple', 'escritura', 'recibo_ibi', 'contrato_compraventa', 'otro')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  cadastral_reference TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_ownership_listing ON public.property_ownership_verifications(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_ownership_status ON public.property_ownership_verifications(status);

CREATE INDEX IF NOT EXISTS idx_identity_verif_user ON public.identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_identity_verif_status ON public.identity_verifications(status);

-- 10. Tabla: user_blocks (Sección 4.4 & 19.1)
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_block UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);

-- 11. Tabla: reports (Denuncias y moderación - Sección 4.4 & 15.5)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'tenant_profile', 'user', 'message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('fake_content', 'wrong_photos', 'inappropriate_behavior', 'suspected_scam', 'spam', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  action_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 12. Tabla: device_tokens (Push Web - Sección 14 & 19.1)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_device_token UNIQUE (user_id, token)
);

-- 13. Tabla: notification_preferences (Sección 14 & 19.1)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('likes', 'messages', 'verification', 'marketing')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_notif_pref UNIQUE (user_id, notification_type)
);

-- 14. Tabla: admin_audit_log (Sección 15.5 & 19.1)
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);

-- 15. Tabla: analytics_events (Sección 16 & 19.1)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
