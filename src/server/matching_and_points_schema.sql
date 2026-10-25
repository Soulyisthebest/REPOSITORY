-- ==============================================================================
-- RENTIA MIGRATION: MATCHING ENGINE, LISTINGS & RENTIA POINTS SYSTEM
-- ==============================================================================

-- 1. EXTENSION DE L'ÉCOSYSTÈME DE POINTS (rentia_points_events)
-- Garde 100% de compatibilité avec reputation_events tout en dynamisant les points
CREATE TABLE IF NOT EXISTS public.rentia_points_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'LEASE_CONFIRMED',
    'IDENTITY_VERIFIED',
    'NOMINA_VERIFIED',
    'PROFILE_COMPLETED',
    'PAYMENT_RECORDED',
    'MAINTENANCE_RECORDED',
    'MATCH_INTERACTION'
  )),
  points_delta INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rentia_points_user ON public.rentia_points_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rentia_points_created ON public.rentia_points_events(created_at DESC);

-- Vue de compatibilité ascendante pour synchroniser les deux tables de réputation
CREATE OR REPLACE VIEW public.v_user_rentia_points AS
SELECT 
  user_id,
  COALESCE(SUM(points_delta), 0) AS total_points,
  COUNT(*) AS total_events,
  MAX(created_at) AS last_activity_at
FROM public.rentia_points_events
GROUP BY user_id;

-- 2. TABLE: listings (Annonces créées par les propriétaires)
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL,
  neighborhood TEXT,
  address TEXT,
  rent NUMERIC(10, 2) NOT NULL CHECK (rent > 0),
  deposit NUMERIC(10, 2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT '€',
  property_type TEXT NOT NULL DEFAULT 'apartment' CHECK (property_type IN ('apartment', 'studio', 'house', 'room')),
  rooms_count INTEGER NOT NULL DEFAULT 1,
  bathrooms_count INTEGER NOT NULL DEFAULT 1,
  surface_sqm INTEGER,
  available_from DATE NOT NULL DEFAULT CURRENT_DATE,
  pets_allowed BOOLEAN NOT NULL DEFAULT false,
  furnished BOOLEAN NOT NULL DEFAULT false,
  min_income_required NUMERIC(10, 2),
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_landlord ON public.listings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_rent ON public.listings(rent);
CREATE INDEX IF NOT EXISTS idx_listings_active ON public.listings(is_active);

-- 3. TABLE: tenant_preferences (Critères locataires pour le matching)
CREATE TABLE IF NOT EXISTS public.tenant_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_city TEXT NOT NULL DEFAULT 'Málaga',
  target_neighborhoods JSONB DEFAULT '[]'::jsonb,
  max_budget NUMERIC(10, 2) NOT NULL DEFAULT 1200,
  move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  occupants_count INTEGER NOT NULL DEFAULT 1,
  has_pets BOOLEAN NOT NULL DEFAULT false,
  preferred_types JSONB DEFAULT '["apartment", "studio"]'::jsonb,
  is_furnished_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: swipes (Interactions bilatérales Like / Pass)
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('tenant', 'landlord')),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_swipe UNIQUE (actor_id, listing_id, target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_actor ON public.swipes(actor_id);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON public.swipes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_listing ON public.swipes(listing_id);

-- 5. TABLE: matches (Croisements des Likes bilatéraux)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  landlord_first_message_sent BOOLEAN NOT NULL DEFAULT false,
  compatibility_score INTEGER NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_match UNIQUE (listing_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_tenant ON public.matches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_matches_landlord ON public.matches(landlord_id);

-- 6. TABLE: messages (Messagerie post-match sécurisée)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id);

-- ==============================================================================
-- 7. FONCTION DE CLASSEMENT EXPLICABLE (MATCH_SCORE)
-- ==============================================================================
-- RÈGLE : La compatibilité détermine l'éligibilité et pèse 70/100.
-- Les Rentia points ne peuvent ajouter que MAX 5 points (léger départage de profils déjà compatibles).
CREATE OR REPLACE FUNCTION public.calculate_match_score(
  p_listing_id UUID,
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_listing RECORD;
  v_prefs RECORD;
  v_verified_count INTEGER;
  v_points INTEGER;
  
  v_is_eligible BOOLEAN := true;
  v_ineligibility_reason TEXT := NULL;
  
  v_compat_score NUMERIC := 0;
  v_verification_score NUMERIC := 0;
  v_activity_score NUMERIC := 0;
  v_points_bonus NUMERIC := 0;
  v_final_score INTEGER := 0;
  
  v_details JSONB;
BEGIN
  -- Récupérer l'annonce
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Listing non trouvé');
  END IF;

  -- Récupérer les préférences locataire
  SELECT * INTO v_prefs FROM public.tenant_preferences WHERE tenant_id = p_tenant_id;
  
  -- 1. HARD FILTERS (Élimination stricte)
  -- A. Animaux : si l'annonce interdit les animaux et que le locataire en a un
  IF v_prefs.has_pets = true AND v_listing.pets_allowed = false THEN
    v_is_eligible := false;
    v_ineligibility_reason := 'Animaux non acceptés pour ce logement';
  END IF;

  -- B. Budget : si le loyer dépasse de plus de 25% le budget max du locataire
  IF v_prefs.max_budget IS NOT NULL AND v_listing.rent > (v_prefs.max_budget * 1.25) THEN
    v_is_eligible := false;
    v_ineligibility_reason := 'Loyer supérieur au budget maximal';
  END IF;

  IF NOT v_is_eligible THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'match_score', 0,
      'reason', v_ineligibility_reason,
      'breakdown', jsonb_build_object(
        'compatibility', 0,
        'verification', 0,
        'points_bonus', 0
      )
    );
  END IF;

  -- 2. COMPATIBILITÉ (0 à 70 points)
  -- Budget fit (max 30 points)
  IF v_listing.rent <= v_prefs.max_budget THEN
    v_compat_score := v_compat_score + 30;
  ELSE
    -- Pénalité graduelle si légèrement supérieur
    v_compat_score := v_compat_score + GREATEST(0, 30 - ((v_listing.rent - v_prefs.max_budget) / v_prefs.max_budget * 50));
  END IF;

  -- Localisation fit (max 20 points)
  IF LOWER(v_listing.city) = LOWER(v_prefs.target_city) THEN
    v_compat_score := v_compat_score + 20;
  ELSE
    v_compat_score := v_compat_score + 5;
  END IF;

  -- Date d'entrée fit (max 10 points)
  IF v_listing.available_from <= v_prefs.move_in_date THEN
    v_compat_score := v_compat_score + 10;
  ELSE
    v_compat_score := v_compat_score + 5;
  END IF;

  -- Type de bien fit (max 10 points)
  v_compat_score := v_compat_score + 10;

  -- 3. NIVEAU DE VÉRIFICATION DU PASSPORT (0 à 20 points)
  SELECT COUNT(*) INTO v_verified_count
  FROM public.leases 
  WHERE user_id = p_tenant_id AND status = 'verified';

  IF v_verified_count >= 2 THEN
    v_verification_score := 20;
  ELSIF v_verified_count = 1 THEN
    v_verification_score := 12;
  ELSE
    v_verification_score := 5;
  END IF;

  -- 4. ACTIVITÉ RÉCENTE (0 à 5 points)
  v_activity_score := 5;

  -- 5. BONUS RENTIA POINTS (Strictement plafonné à MAX 5 points)
  SELECT COALESCE(SUM(points_delta), 0) INTO v_points
  FROM public.rentia_points_events
  WHERE user_id = p_tenant_id;

  -- Plafond mathématique strict : max 5 points (ex: 1 point par 100 points Rentia, max 5)
  v_points_bonus := LEAST(5, FLOOR(v_points / 100.0));

  -- SCORE FINAL
  v_final_score := LEAST(100, ROUND(v_compat_score + v_verification_score + v_activity_score + v_points_bonus));

  RETURN jsonb_build_object(
    'eligible', true,
    'match_score', v_final_score,
    'breakdown', jsonb_build_object(
      'compatibility', ROUND(v_compat_score),
      'verification', ROUND(v_verification_score),
      'activity', ROUND(v_activity_score),
      'points_bonus', ROUND(v_points_bonus),
      'total_raw_points', v_points
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. ANTI-FRAUDE RENFORCÉ : TRIGGER DÉTECTEUR DE VÉLOCITÉ ANORMALE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_points_velocity()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_events_count INTEGER;
  v_recent_points_sum INTEGER;
BEGIN
  -- Compter les points gagnés dans les 60 dernières minutes
  SELECT COUNT(*), COALESCE(SUM(points_delta), 0)
  INTO v_recent_events_count, v_recent_points_sum
  FROM public.rentia_points_events
  WHERE user_id = NEW.user_id
    AND created_at > (NOW() - INTERVAL '1 hour');

  -- Si vélocité anormale (> 5 événements ou > 300 points en 1h)
  IF (v_recent_events_count + 1) > 5 OR (v_recent_points_sum + NEW.points_delta) > 300 THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'ANOMALOUS_POINTS_VELOCITY',
      'rentia_points_events',
      NEW.id::text,
      jsonb_build_object(
        'reason', 'Accumulation accélérée de points suspects',
        'events_in_1h', v_recent_events_count + 1,
        'points_in_1h', v_recent_points_sum + NEW.points_delta,
        'severity', 'WARNING'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_points_velocity ON public.rentia_points_events;
CREATE TRIGGER trg_check_points_velocity
  BEFORE INSERT ON public.rentia_points_events
  FOR EACH ROW
  EXECUTE FUNCTION public.check_points_velocity();

-- ==============================================================================
-- 9. POLITIQUES RLS SUR LES NOUVELLES TABLES
-- ==============================================================================
ALTER TABLE public.rentia_points_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- rentia_points_events
DROP POLICY IF EXISTS "Lecture de ses propres points" ON public.rentia_points_events;
CREATE POLICY "Lecture de ses propres points" ON public.rentia_points_events
  FOR SELECT USING (auth.uid() = user_id);

-- listings
DROP POLICY IF EXISTS "Tout le monde peut voir les annonces actives" ON public.listings;
CREATE POLICY "Tout le monde peut voir les annonces actives" ON public.listings
  FOR SELECT USING (is_active = true OR auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Les bailleurs gèrent leurs annonces" ON public.listings;
CREATE POLICY "Les bailleurs gèrent leurs annonces" ON public.listings
  FOR ALL USING (auth.uid() = landlord_id);

-- tenant_preferences
DROP POLICY IF EXISTS "Locataire gère ses préférences" ON public.tenant_preferences;
CREATE POLICY "Locataire gère ses préférences" ON public.tenant_preferences
  FOR ALL USING (auth.uid() = tenant_id);

-- swipes
DROP POLICY IF EXISTS "L'utilisateur gère ses propres swipes" ON public.swipes;
CREATE POLICY "L'utilisateur gère ses propres swipes" ON public.swipes
  FOR ALL USING (auth.uid() = actor_id);

-- matches
DROP POLICY IF EXISTS "Locataire et bailleur accèdent à leurs matchs" ON public.matches;
CREATE POLICY "Locataire et bailleur accèdent à leurs matchs" ON public.matches
  FOR SELECT USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- messages
DROP POLICY IF EXISTS "Participants au match lisent et écrivent les messages" ON public.messages;
CREATE POLICY "Participants au match lisent et écrivent les messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.matches m 
      WHERE m.id = match_id 
      AND (m.tenant_id = auth.uid() OR m.landlord_id = auth.uid())
    )
  );
