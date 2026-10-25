-- ==============================================================================
-- RENTIA — PATCH DE SÉCURITÉ IMMÉDIAT (Supabase SQL Editor)
-- À exécuter dans Supabase Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1) Retire l'accès public complet aux profils (email/téléphone privés)
DROP POLICY IF EXISTS "Profil public visible pour inspection de passeport" ON public.profiles;

-- 2) Retire l'accès public direct à la table leases
DROP POLICY IF EXISTS "Les propriétaires peuvent lire un bail par son code pour le valider" ON public.leases;

-- 3) Retire la possibilité de créer une fausse attestation librement sans passer par RPC
DROP POLICY IF EXISTS "Création d'une attestation" ON public.verifications;

-- 4) Empêche de supprimer ou modifier une location déjà vérifiée (Verrou WORM anti-fraude)
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

-- 5) Fonction RPC sécurisée : le propriétaire consulte UNIQUEMENT via le code exact (6 caractères),
--    et ne voit jamais l'email/téléphone privé du locataire.
CREATE OR REPLACE FUNCTION public.lookup_lease_by_code(p_code TEXT)
RETURNS TABLE (
  lease_id UUID, 
  tenant_name TEXT, 
  address TEXT, 
  city TEXT,
  start_date TEXT, 
  end_date TEXT, 
  status TEXT
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT l.id, p.name, l.address, l.city, l.start_date, l.end_date, l.status
  FROM public.leases l
  JOIN public.profiles p ON p.id = l.user_id
  WHERE l.code = UPPER(p_code) AND l.status = 'pending';
$$;

-- 6) Fonction RPC sécurisée : le propriétaire confirme UNIQUEMENT via le code exact,
--    une seule fois, génère l'empreinte SHA-256 et met à jour le statut du bail.
CREATE OR REPLACE FUNCTION public.confirm_lease_by_code(
  p_code TEXT, 
  p_tenancy_confirmed TEXT, 
  p_rent_paid_ok TEXT,
  p_property_maintained TEXT, 
  p_would_recommend TEXT, 
  p_comment TEXT
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
    lease_id, 
    tenancy_confirmed, 
    rent_paid_ok, 
    property_maintained,
    would_recommend, 
    comment, 
    crypto_hash
  ) VALUES (
    v_lease_id, 
    p_tenancy_confirmed, 
    p_rent_paid_ok, 
    p_property_maintained,
    p_would_recommend, 
    p_comment, 
    encode(digest(v_lease_id::text || NOW()::text, 'sha256'), 'hex')
  );

  UPDATE public.leases
  SET status = CASE WHEN p_tenancy_confirmed = 'yes' THEN 'verified' ELSE 'rejected' END
  WHERE id = v_lease_id;

  RETURN 'ok';
END;
$$;

-- 7) Contrainte d'unicité sur le numéro de téléphone (un numéro ne peut être associé qu'à un seul compte)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL AND phone <> '';

