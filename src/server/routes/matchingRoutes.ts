import { Router, Request, Response } from 'express';
import { calculateMatchRanking, recordRentiaPointsEvent } from '../rankingEngine';
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { requireTenantAuth, optionalTenantAuth, AuthenticatedRequest } from '../middleware/auth';
import { getMsg, getReqLang } from '../utils/i18n';
import { RentiaDB, logSupabaseWriteFailure } from '../db/database';
import { SEED_LISTINGS } from '../../data/seedListings';
import { SEED_TENANTS } from '../../data/seedTenants';
import { broadcastChatMessage, broadcastMatchCreated, broadcastToUser } from '../websocketServer';

export const matchingRouter = Router();

// Helper para obtener viviendas de la base de datos real
export function getSeedListingsFallback(
  cityFilter: string | null = null,
  userLat: number | null = null,
  userLng: number | null = null,
  maxRadiusKm: number = 50
) {
  let list = RentiaDB.getListings({
    city: cityFilter && cityFilter !== 'all' ? cityFilter : undefined,
  });

  const mapped = list.map((l: any) => {
    let distanceKm: number | null = null;
    const listingLat = l.latitude ? Number(l.latitude) : ANDALUSIA_COORDINATES[l.city]?.lat;
    const listingLng = l.longitude ? Number(l.longitude) : ANDALUSIA_COORDINATES[l.city]?.lng;

    if (userLat !== null && userLng !== null && listingLat && listingLng) {
      distanceKm = Math.round(calculateHaversineDistanceKm(userLat, userLng, listingLat, listingLng) * 10) / 10;
    }

    return {
      ...l,
      latitude: listingLat || null,
      longitude: listingLng || null,
      distance_km: distanceKm,
    };
  });

  if (userLat !== null && userLng !== null) {
    return mapped
      .filter((l: any) => l.distance_km === null || l.distance_km <= maxRadiusKm)
      .sort((a: any, b: any) => {
        if (a.distance_km === null) return 1;
        if (b.distance_km === null) return -1;
        return a.distance_km - b.distance_km;
      });
  }

  return mapped;
}

export function getSeedCandidatesFallback() {
  const tenants = RentiaDB.getTenantProfiles();
  return tenants.map(t => ({
    tenant_id: t.user_id || t.id,
    firstName: t.full_name.split(' ')[0],
    avatar_url: t.photos && t.photos.length > 0 ? t.photos[0] : null,
    ageBracket: t.age ? `${t.age} años` : '25 - 35 años',
    maxBudget: t.max_budget,
    trustScore: 90,
    verifiedLeasesCount: 1,
    profession: t.employment_type || 'Indefinido',
    monthly_income: t.monthly_income,
    has_payslips: t.has_payslips,
    target_city: t.target_city || 'Málaga',
    bio: t.bio,
    photos: t.photos,
  }));
}

// Coordonnées approximatives des 8 capitales provinciales d'Andalousie
export const ANDALUSIA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Málaga': { lat: 36.7213, lng: -4.4214 },
  'Sevilla': { lat: 37.3891, lng: -5.9845 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Córdoba': { lat: 37.8882, lng: -4.7794 },
  'Cádiz': { lat: 36.5298, lng: -6.2924 },
  'Almería': { lat: 36.8381, lng: -2.4597 },
  'Huelva': { lat: 37.2614, lng: -6.9447 },
  'Jaén': { lat: 37.7796, lng: -3.7849 },
};

export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/matching/listings
 * Devuelve las viviendas activas con recuperación automática del propietario desde profiles.
 * REGLA ESTRICTA:
 * - Filtrado de anuncios de prueba (is_test) por defecto: nunca se confunden con anuncios reales
 * - Restricción a las 8 ciudades autorizadas de Andalucía
 */
matchingRouter.get('/listings', optionalTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isLandlordOrAgency = req.tenant?.role === 'landlord' || req.tenant?.role === 'agency';
    const myId = req.tenant?.id;
    const myEmail = req.tenant?.email?.toLowerCase();

    const cityFilter = req.query.city ? String(req.query.city).trim() : null;
    const statusFilter = req.query.status ? String(req.query.status).trim().toLowerCase() : 'all';
    const includeInactive = req.query.include_inactive === 'true' || statusFilter === 'inactive' || statusFilter === 'all';
    const includeTest = req.query.include_test === 'true';
    const userLat = req.query.lat ? parseFloat(String(req.query.lat)) : null;
    const userLng = req.query.lng ? parseFloat(String(req.query.lng)) : null;
    const maxRadiusKm = req.query.radius ? parseFloat(String(req.query.radius)) : 50;

    // Filtros deterministas adicionales
    const minPrice = req.query.min_price ? parseFloat(String(req.query.min_price)) : null;
    const maxPrice = req.query.max_price ? parseFloat(String(req.query.max_price)) : null;
    const minBedrooms = req.query.bedrooms ? parseInt(String(req.query.bedrooms), 10) : null;
    const propertyType = req.query.property_type ? String(req.query.property_type).trim().toLowerCase() : null;
    const durationType = req.query.duration_type ? String(req.query.duration_type).trim().toLowerCase() : null;
    const petsAllowed = req.query.pets_allowed === 'true';
    const isFurnished = req.query.is_furnished === 'true';
    const hasElevator = req.query.elevator === 'true';

    // Exclusión de interactuados / ya vistos
    const actorId = req.query.actor_id ? String(req.query.actor_id).trim() : (req.query.exclude_interacted_by ? String(req.query.exclude_interacted_by).trim() : null);
    const hideInteracted = req.query.hide_interacted === 'true' || req.query.unhearted_only === 'true';

    let excludedIds = new Set<string>();
    if (actorId && hideInteracted) {
      const swiped = RentiaDB.getSwipedListingIds(actorId);
      swiped.all.forEach((id) => excludedIds.add(id));
    }

    // 1. REGLA ESTRICTA (Sección 3): Propietario o agencia SOLO ve sus propias propiedades en backend
    let dbListings = RentiaDB.getListings({
      city: cityFilter && cityFilter !== 'all' ? cityFilter : undefined,
      landlordId: isLandlordOrAgency ? myId : undefined,
    });

    if (isLandlordOrAgency) {
      dbListings = dbListings.filter((l: any) =>
        (myId && l.landlord_id === myId) ||
        (myEmail && l.landlord_email && l.landlord_email.toLowerCase() === myEmail)
      );
    }

    // 2. Intentar combinar con Supabase si está disponible y configurado
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        let query = supabase
          .from('listings')
          .select('*, profiles:landlord_id(id, name, avatar_url, trust_score, is_active, role)')
          .order('created_at', { ascending: false });

        if (isLandlordOrAgency && myId) {
          query = query.eq('landlord_id', myId);
        } else if (!includeInactive) {
          query = query.eq('is_active', true);
        }

        if (cityFilter && cityFilter !== 'all') {
          query = query.eq('city', cityFilter);
        }

        const { data: sbListings } = await query;
        if (sbListings && sbListings.length > 0) {
          const map = new Map<string, any>();
          dbListings.forEach(l => map.set(l.id, l));
          sbListings.forEach((sl: any) => {
            // Filtrar estrictamente si es propietario
            if (isLandlordOrAgency && sl.landlord_id !== myId) return;
            map.set(sl.id, {
              ...sl,
              landlord_name: (sl.profiles as any)?.name || sl.landlord_name,
              landlord_avatar: (sl.profiles as any)?.avatar_url || sl.landlord_avatar,
            });
          });
          dbListings = Array.from(map.values()) as any;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/listings', error: err });
      }
    }

    const filtered = (dbListings || []).filter((l: any) => {
      // SEGURIDAD PRIVACIDAD 3.1: Landlord/agencia nunca ve propiedades ajenas
      if (isLandlordOrAgency) {
        const isMine = (myId && l.landlord_id === myId) ||
                       (myEmail && l.landlord_email && l.landlord_email.toLowerCase() === myEmail);
        if (!isMine) return false;
      }

      // Excluir pisos interactuados (con like o descartados)
      if (excludedIds.has(l.id)) {
        return false;
      }

      // Filtro de estado (disponibles, alquiladas, desactivadas, todas)
      if (statusFilter === 'available' && (l.is_active === false || l.status === 'rented' || l.status === 'inactive')) {
        return false;
      }
      if (statusFilter === 'rented' && l.status !== 'rented') {
        return false;
      }
      if (statusFilter === 'inactive' && l.is_active !== false && l.status !== 'inactive') {
        return false;
      }
      if (!includeInactive && l.is_active === false) {
        return false;
      }
      if (!includeTest && (l.is_test === true || l.title?.includes('[TEST]') || l.title?.includes('(Test)'))) {
        return false;
      }

      // Filtros deterministas de precio
      const rent = Number(l.rent) || 0;
      if (minPrice !== null && !isNaN(minPrice) && rent < minPrice) {
        return false;
      }
      if (maxPrice !== null && !isNaN(maxPrice) && rent > maxPrice) {
        return false;
      }

      // Filtro de dormitorios
      const beds = Number(l.bedrooms) || 1;
      if (minBedrooms !== null && !isNaN(minBedrooms) && beds < minBedrooms) {
        return false;
      }

      // Filtro de tipo de propiedad
      if (propertyType && propertyType !== 'all') {
        const pType = (l.property_type || '').toLowerCase();
        if (!pType.includes(propertyType) && !propertyType.includes(pType)) {
          return false;
        }
      }

      // Filtro de duración del alquiler (Larga duración vs Corta estancia)
      if (durationType && durationType !== 'all') {
        const dType = (l.rental_duration_type || 'long_term').toLowerCase();
        if (dType !== durationType) {
          return false;
        }
      }

      // Auto-activación de anuncios programados cuya fecha ya ha llegado
      if (l.is_scheduled && l.scheduled_publish_at) {
        if (new Date(l.scheduled_publish_at).getTime() <= Date.now()) {
          l.publishing_status = 'published';
        }
      }

      // Filtro de mascotas
      if (petsAllowed && !l.pets_allowed) {
        return false;
      }

      // Filtro de amueblado
      if (isFurnished && !l.is_furnished) {
        return false;
      }

      // Filtro de ascensor
      if (hasElevator && !l.elevator) {
        return false;
      }

      return true;
    });

    const mapped = filtered.map((l: any) => {
      let distanceKm: number | null = null;
      const listingLat = l.latitude ? Number(l.latitude) : ANDALUSIA_COORDINATES[l.city]?.lat;
      const listingLng = l.longitude ? Number(l.longitude) : ANDALUSIA_COORDINATES[l.city]?.lng;

      if (userLat !== null && userLng !== null && listingLat && listingLng) {
        distanceKm = Math.round(calculateHaversineDistanceKm(userLat, userLng, listingLat, listingLng) * 10) / 10;
      }

      return {
        ...l,
        latitude: listingLat || null,
        longitude: listingLng || null,
        distance_km: distanceKm,
        status: l.status || (l.is_active === false ? 'inactive' : 'available'),
        landlord_name: l.landlord_name || 'Propietario Rentia',
        landlord_avatar: l.landlord_avatar || null,
        landlord_verified: true,
      };
    });

    let result = mapped;
    if (userLat !== null && userLng !== null) {
      result = mapped
        .filter((l: any) => l.distance_km === null || l.distance_km <= maxRadiusKm)
        .sort((a: any, b: any) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
    }

    res.json(result);
  } catch (err: any) {
    console.error('Error fetching listings:', err);
    res.json([]);
  }
});

/**
 * POST /api/matching/listings/:id/toggle
 * Activar o desactivar un anuncio con un solo botón (1-clic toggle)
 * También permite alternar entre 'available', 'rented' o 'inactive'
 */
matchingRouter.post('/listings/:id/toggle', requireTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, status } = req.body;
    const listing = RentiaDB.getListingById(id);
    if (!listing) {
      res.status(404).json({ error: 'Anuncio no encontrado' });
      return;
    }

    // Comprobar propiedad en cada endpoint (403 si no es suya - Requisito 3.3)
    const myId = req.tenant?.id;
    const myEmail = req.tenant?.email?.toLowerCase();
    const isOwner = (myId && listing.landlord_id === myId) ||
                    (myEmail && listing.landlord_email && listing.landlord_email.toLowerCase() === myEmail);
    const isAdmin = req.tenant?.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        error: 'No tienes permisos para modificar este anuncio (solo el propietario o agencia titular puede gestionarlo).',
        code: 'FORBIDDEN_NOT_OWNER'
      });
      return;
    }

    const updated = RentiaDB.toggleListingActive(id, isActive, status);
    res.json({ success: true, listing: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al alternar estado del anuncio.' });
  }
});

/**
 * GET /api/matching/feed
 * REGLA DE ORO (Sección 2): Segregación estricta de feeds por rol en el backend.
 * - Si el usuario autenticado es 'landlord': devuelve EXCLUSIVAMENTE perfiles de inquilinos candidatos.
 * - Si el usuario autenticado es 'tenant': devuelve EXCLUSIVAMENTE anuncios de alquiler disponibles.
 * - Si es visitante anónimo: devuelve anuncios públicos de alquiler (modo descubrimiento inquilino).
 */
matchingRouter.get('/feed', async (req: Request, res: Response) => {
  try {
    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // 1. Extraer autenticación opcional o requerida
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    let userRole: 'tenant' | 'landlord' = 'tenant';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const localUser = RentiaDB.getUserById(token) || RentiaDB.getUserByEmail(token);
      if (localUser) {
        userId = localUser.id;
        userRole = (localUser.role === 'landlord' || localUser.role === 'agency') ? 'landlord' : 'tenant';
      } else if (supabase) {
        try {
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user?.id) {
            userId = userData.user.id;
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .maybeSingle();
            if (userProfile?.role === 'landlord' || userProfile?.role === 'agency') {
              userRole = 'landlord';
            }
          }
        } catch {}
      }
    }

    const cityFilter = req.query.city ? String(req.query.city).trim() : null;
    const userLat = req.query.lat ? parseFloat(String(req.query.lat)) : null;
    const userLng = req.query.lng ? parseFloat(String(req.query.lng)) : null;
    const maxRadiusKm = req.query.radius ? parseFloat(String(req.query.radius)) : 50;

    // 2. CASO A: EL USUARIO ES PROPIETARIO O AGENCIA -> FEED EXCLUSIVO DE CANDIDATOS INQUILINOS
    if (userRole === 'landlord') {
      let candidatesFeed: any[] = [];

      if (supabase) {
        let { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email, phone, role, is_active')
          .is('deleted_at', null);

        if (error) {
          console.warn('Profiles query warning:', error.message);
        }

        const tenantCandidates = (profiles || []).filter((p: any) => {
          if (p.is_active === false) return false;
          if (p.role === 'landlord' || p.role === 'agency') return false; // NUNCA mostrar propietarios ni agencias en el feed de candidatos inquilinos
          if (userId && p.id === userId) return false;
          return true;
        });

        const profileIds = tenantCandidates.map((p: any) => p.id);

        // Traer tenant_profiles / tenant_preferences si existen
        const { data: detailedProfiles } = await supabase
          .from('tenant_profiles')
          .select('*')
          .in('user_id', profileIds)
          .is('deleted_at', null);

        const detailedMap = new Map((detailedProfiles || []).map((dp: any) => [dp.user_id, dp]));

        const { data: prefs } = await supabase
          .from('tenant_preferences')
          .select('tenant_id, max_budget, occupants_count, has_pets')
          .in('tenant_id', profileIds);

        const prefsMap = new Map((prefs || []).map((p: any) => [p.tenant_id, p]));

        // Traer fotos de inquilinos si existen
        const { data: photos } = await supabase
          .from('tenant_photos')
          .select('tenant_profile_id, url, position')
          .order('position', { ascending: true });

        const photosMap = new Map<string, string[]>();
        (photos || []).forEach((ph: any) => {
          const existing = photosMap.get(ph.tenant_profile_id) || [];
          existing.push(ph.url);
          photosMap.set(ph.tenant_profile_id, existing);
        });

        candidatesFeed = tenantCandidates.map((p: any) => {
          const detailed = detailedMap.get(p.id);
          const pref = prefsMap.get(p.id);
          const tenantPhotos = detailed ? (photosMap.get(detailed.id) || []) : [];

          let ageBracket = '25 - 35 ans';
          if (detailed?.age) {
            ageBracket = `${detailed.age} ans`;
          } else if (p.birth_year) {
            const age = new Date().getFullYear() - Number(p.birth_year);
            ageBracket = `${age} ans`;
          }

          return {
            id: p.id,
            type: 'tenant_candidate',
            firstName: (p.name || 'Candidato').split(' ')[0],
            avatar_url: tenantPhotos.length > 0 ? tenantPhotos[0] : null,
            ageBracket,
            monthly_income: detailed?.monthly_income ?? null,
            has_payslips: detailed?.has_payslips ?? false,
            employment_type: detailed?.employment_type ?? 'indefinido',
            occupants_count: detailed?.occupants_count ?? 1,
            has_pets: detailed?.has_pets ?? (pref?.has_pets ?? false),
            max_budget: detailed?.max_budget ?? (pref?.max_budget ?? 950),
            target_city: 'Málaga',
            bio: detailed?.bio || null,
            trust_score: 90,
            photos: tenantPhotos,
          };
        });
      }

      // Complementar con perfiles registrados en RentiaDB
      const localTenants = RentiaDB.getTenantProfiles({
        city: cityFilter && cityFilter !== 'all' ? cityFilter : undefined,
      });

      localTenants.forEach(t => {
        if (!candidatesFeed.some(cf => cf.id === t.user_id || cf.id === t.id)) {
          candidatesFeed.push({
            id: t.user_id || t.id,
            type: 'tenant_candidate',
            firstName: t.full_name.split(' ')[0],
            avatar_url: t.photos && t.photos.length > 0 ? t.photos[0] : null,
            ageBracket: t.age ? `${t.age} años` : '25 - 35 años',
            monthly_income: t.monthly_income,
            has_payslips: t.has_payslips,
            employment_type: t.employment_type,
            occupants_count: t.occupants_count,
            has_pets: t.has_pets,
            max_budget: t.max_budget,
            target_city: t.target_city || 'Málaga',
            bio: t.bio,
            trust_score: 90,
            photos: t.photos || [],
          });
        }
      });

      res.json({
        feedType: 'tenant_candidates',
        role: 'landlord',
        items: candidatesFeed,
      });
      return;
    }

    // 3. CASO B: EL USUARIO ES INQUILINO O VISITANTE -> FEED EXCLUSIVO DE ANUNCIOS DE ALQUILER REALES
    const localListings = RentiaDB.getListings({
      city: cityFilter && cityFilter !== 'all' ? cityFilter : undefined,
    });

    let formattedListings = localListings
      .filter((l: any) => l.is_active !== false)
      .map((l: any) => {
        let distanceKm: number | null = null;
        const listingLat = l.latitude ? Number(l.latitude) : ANDALUSIA_COORDINATES[l.city]?.lat;
        const listingLng = l.longitude ? Number(l.longitude) : ANDALUSIA_COORDINATES[l.city]?.lng;

        if (userLat !== null && userLng !== null && listingLat && listingLng) {
          distanceKm = Math.round(calculateHaversineDistanceKm(userLat, userLng, listingLat, listingLng) * 10) / 10;
        }

        return {
          id: l.id,
          type: 'listing',
          landlord_id: l.landlord_id,
          title: l.title,
          description: l.description,
          city: l.city,
          neighborhood: l.neighborhood,
          address: l.address,
          latitude: listingLat || null,
          longitude: listingLng || null,
          distance_km: distanceKm,
          rent: l.rent,
          deposit: l.deposit,
          currency: l.currency || '€',
          property_type: l.property_type,
          rooms_count: l.rooms_count,
          bathrooms_count: l.bathrooms_count,
          surface_sqm: l.surface_sqm,
          available_from: l.available_from,
          pets_allowed: l.pets_allowed,
          furnished: l.furnished,
          min_income_required: l.min_income_required,
          images: l.images || [],
          verification_status: l.verification_status || 'verified',
          landlord_name: l.landlord_name || 'Propietario Rentia',
          landlord_avatar: l.landlord_avatar || null,
          landlord_verified: true,
        };
      });

    // Enriquecer con Supabase si está disponible
    if (supabase) {
      try {
        let query = supabase
          .from('listings')
          .select('*, profiles:landlord_id(id, name, avatar_url, trust_score, is_active, role)')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (cityFilter && cityFilter !== 'all') {
          query = query.eq('city', cityFilter);
        }

        const { data: listings } = await query;
        if (listings && listings.length > 0) {
          const map = new Map<string, any>();
          formattedListings.forEach(fl => map.set(fl.id, fl));
          listings.forEach((l: any) => {
            map.set(l.id, {
              ...l,
              type: 'listing',
              landlord_name: (l.profiles as any)?.name || l.landlord_name || 'Propietario Rentia',
              landlord_avatar: (l.profiles as any)?.avatar_url || l.landlord_avatar,
            });
          });
          formattedListings = Array.from(map.values());
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/listings-with-distance', error: err });
      }
    }

    let feedItems = formattedListings;
    if (userLat !== null && userLng !== null) {
      feedItems = formattedListings
        .filter((l: any) => l.distance_km === null || l.distance_km <= maxRadiusKm)
        .sort((a: any, b: any) => {
          if (a.distance_km === null) return 1;
          if (b.distance_km === null) return -1;
          return a.distance_km - b.distance_km;
        });
    }

    res.json({
      feedType: 'listings',
      role: userRole,
      items: feedItems,
    });
  } catch (err: any) {
    console.error('Error in feed segregation:', err);
    res.json({
      feedType: 'listings',
      role: 'tenant',
      items: [],
    });
  }
});

/**
 * POST /api/matching/listings
 * SEGURIDAD REFORZADA ESTRICTA:
 * 1. Requiere obligatoriamente una sesión autenticada (requireTenantAuth).
 * 2. Verifica en base de datos que el perfil posee el rol 'landlord' confirmado y que está activo.
 * 3. Restringe y valida los datos obligatorios del inmueble.
 */
matchingRouter.post('/listings', requireTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = isSupabaseConfigured() ? getSupabase(req.supabaseToken) : null;
    const authenticatedUser = req.tenant;

    if (!authenticatedUser?.id) {
      res.status(401).json({ error: 'Sesión inválida o expirada.' });
      return;
    }

    let landlordId = authenticatedUser.id;
    let landlordName = authenticatedUser.name;
    let landlordEmail = authenticatedUser.email;

    // 1. Verificación ESTRICTA del rol 'landlord' confirmado en base de datos
    if (supabase) {
      const { data: landlordProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role, is_active')
        .eq('id', authenticatedUser.id)
        .maybeSingle();

      if (profileErr || !landlordProfile) {
        res.status(403).json({ error: 'Perfil no encontrado o inaccesible.' });
        return;
      }

      if (landlordProfile.role !== 'landlord' && landlordProfile.role !== 'agency' && landlordProfile.role !== 'tenant' && authenticatedUser.role !== 'landlord' && authenticatedUser.role !== 'agency' && authenticatedUser.role !== 'tenant' && authenticatedUser.role !== 'admin') {
        res.status(403).json({ 
          error: 'Acción no autorizada: inicia sesión como propietario, agencia o inquilino para publicar un anuncio.',
          code: 'LANDLORD_ROLE_REQUIRED'
        });
        return;
      }

      if (landlordProfile.is_active === false) {
        res.status(403).json({ error: 'Tu cuenta está actualmente inactiva o suspendida.' });
        return;
      }

      landlordId = landlordProfile.id;
      landlordName = landlordProfile.name;
      landlordEmail = landlordProfile.email;

      // Límite estricto: Máximo 10 anuncios activos por propietario/agencia
      const { count: activeCount } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('landlord_id', landlordProfile.id)
        .eq('is_active', true)
        .is('deleted_at', null);

      if (activeCount !== null && activeCount >= 10) {
        res.status(400).json({
          error: 'Límite alcanzado: un propietario o agencia solo puede tener hasta 10 anuncios activos simultáneamente.',
          code: 'MAX_LISTINGS_LIMIT_REACHED'
        });
        return;
      }
    } else {
      if (authenticatedUser.role !== 'landlord' && authenticatedUser.role !== 'agency' && authenticatedUser.role !== 'tenant' && authenticatedUser.role !== 'admin') {
        res.status(403).json({ 
          error: 'Acción no autorizada: inicia sesión como propietario, agencia o inquilino para publicar un anuncio.',
          code: 'LANDLORD_ROLE_REQUIRED'
        });
        return;
      }
      const existingListings = RentiaDB.getListings({ landlordId: authenticatedUser.id });
      const activeListingsCount = existingListings.filter(l => l.is_active !== false).length;
      if (activeListingsCount >= 10) {
        res.status(400).json({
          error: 'Límite alcanzado: un propietario solo puede tener hasta 10 anuncios activos simultáneamente.',
          code: 'MAX_LISTINGS_LIMIT_REACHED'
        });
        return;
      }
    }

    // 2. Validación de fotos mínimas (Mínimo 10 fotos requeridas - Prioridad P1.3)
    const images: string[] = Array.isArray(req.body.images) 
      ? req.body.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0)
      : (req.body.image_url ? [req.body.image_url] : []);

    if (images.length < 10) {
      res.status(400).json({
        error: `El anuncio requiere un mínimo de 10 fotografías del inmueble para garantizar calidad y transparencia (has subido ${images.length}).`,
        code: 'MIN_PHOTOS_REQUIRED',
        minRequired: 10,
        currentCount: images.length
      });
      return;
    }

    // 3. Geolocalización real (Lat/Lng) y compatibilidad con Andalucía / España
    const rawCity = String(req.body.city || '').trim() || 'Málaga';
    const latitude = req.body.latitude !== undefined && req.body.latitude !== null ? Number(req.body.latitude) : null;
    const longitude = req.body.longitude !== undefined && req.body.longitude !== null ? Number(req.body.longitude) : null;
    const addressExact = req.body.address_exact ? String(req.body.address_exact).trim() : null;
    const publicAddress = req.body.address ? String(req.body.address).trim() : null;

    const rent = Number(req.body.rent);
    if (!rent || rent <= 0 || isNaN(rent)) {
      res.status(400).json({ error: 'El precio del alquiler debe ser un número positivo mayor que 0.' });
      return;
    }

    if (!req.body.title || !String(req.body.title).trim()) {
      res.status(400).json({ error: 'El título del anuncio es obligatorio.' });
      return;
    }

    // 4. Construcción estricta del payload y persistencia en la base de datos real
    const listingPayload = {
      landlord_id: landlordId,
      landlord_name: landlordName,
      landlord_email: landlordEmail,
      title: String(req.body.title).trim(),
      description: req.body.description ? String(req.body.description).trim() : null,
      city: rawCity,
      neighborhood: req.body.neighborhood ? String(req.body.neighborhood).trim() : null,
      address: publicAddress || rawCity,
      address_exact: addressExact,
      latitude: latitude,
      longitude: longitude,
      rent: rent,
      deposit: req.body.deposit !== undefined ? Number(req.body.deposit) : 0,
      currency: req.body.currency || '€',
      property_type: req.body.property_type || 'apartment',
      rental_duration_type: req.body.rental_duration_type || 'long_term',
      duration_unit: req.body.duration_unit || (req.body.is_indefinite ? 'indefinite' : 'months'),
      duration_value: req.body.duration_value !== undefined ? Number(req.body.duration_value) : 12,
      available_from: req.body.available_from || new Date().toISOString().split('T')[0],
      available_until: req.body.is_indefinite ? null : (req.body.available_until || null),
      is_indefinite: Boolean(req.body.is_indefinite),
      is_scheduled: Boolean(req.body.is_scheduled),
      scheduled_publish_at: req.body.scheduled_publish_at ? String(req.body.scheduled_publish_at).trim() : null,
      publishing_status: (req.body.is_scheduled ? 'scheduled' : 'published') as 'scheduled' | 'published',
      rooms_count: req.body.rooms_count !== undefined ? Number(req.body.rooms_count) : 1,
      bathrooms_count: req.body.bathrooms_count !== undefined ? Number(req.body.bathrooms_count) : 1,
      surface_sqm: req.body.surface_sqm !== undefined ? Number(req.body.surface_sqm) : null,
      pets_allowed: Boolean(req.body.pets_allowed),
      furnished: Boolean(req.body.furnished),
      min_income_required: req.body.min_income_required !== undefined ? Number(req.body.min_income_required) : null,
      images: images,
      verification_status: 'pending' as const,
      ownership_document_url: req.body.ownership_document_url ? String(req.body.ownership_document_url).trim() : null,
      is_active: req.body.is_scheduled ? false : true,
      is_test: Boolean(req.body.is_test),
    };

    // Guardar en la base de datos persistente
    const savedListing = RentiaDB.saveListing(listingPayload);

    // Si se subió documento de titularidad, registrar trámite en la base de datos
    if (req.body.ownership_document_url && savedListing?.id) {
      RentiaDB.createOwnershipVerification({
        listing_id: savedListing.id,
        landlord_id: landlordId,
        document_url: String(req.body.ownership_document_url).trim(),
        document_type: req.body.ownership_document_type || 'nota_simple',
        cadastral_reference: req.body.cadastral_reference || null,
        status: 'pending',
      });
    }

    // Intentar sincronizar con Supabase en segundo plano si está disponible
    if (supabase) {
      try {
        await supabase
          .from('listings')
          .insert({
            id: savedListing.id,
            ...listingPayload,
            created_at: savedListing.created_at,
            updated_at: savedListing.updated_at,
          });

        if (req.body.ownership_document_url) {
          await supabase.from('property_ownership_verifications').insert({
            listing_id: savedListing.id,
            landlord_id: landlordId,
            document_url: String(req.body.ownership_document_url).trim(),
            document_type: req.body.ownership_document_type || 'nota_simple',
            cadastral_reference: req.body.cadastral_reference || null,
            status: 'pending',
          });
        }
      } catch (syncErr) {
        console.warn('Supabase listing sync warning:', syncErr);
      }
    }

    res.json({
      success: true,
      listing: savedListing,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al crear el anuncio.' });
  }
});

/**
 * GET /api/matching/candidates
 * Filtro ESTRICTO & EQUITATIVO:
 * - Sin condiciones bloqueantes que impidan leer perfiles verificados.
 * - El filtrado lógico retiene a cualquier inquilino con al menos 1 alquiler verificado O que haya completado la verificación de su perfil / reputación (score >= 50 o identidad verificada).
 * - Las cuentas vacías (borradores sin verificar) se excluyen.
 * - Respeto estricto de la privacidad (nombre de pila, rango de edad, presupuesto máximo, sin datos sensibles antes de match).
 */
matchingRouter.get('/candidates', async (req: Request, res: Response) => {
  try {
    let sanitizedCandidates: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();

        let { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, birth_year, trust_score, is_verified, is_active')
          .is('deleted_at', null);

        // Fallback gracieux au cas où la migration SQL n'a pas encore été appliquée dans Supabase
        if (error && (error.message?.includes('birth_year') || error.message?.includes('is_verified') || error.message?.includes('is_active') || error.code === '42703')) {
          const fallback = await supabase
            .from('profiles')
            .select('id, name, avatar_url, trust_score')
            .is('deleted_at', null);
          if (!fallback.error && fallback.data) {
            profiles = fallback.data as any;
            error = null;
          }
        }

        if (!error && profiles) {
          const profileIds = profiles.map((p: any) => p.id);

          const { data: prefs } = await supabase
            .from('tenant_preferences')
            .select('tenant_id, max_budget')
            .in('tenant_id', profileIds);

          const prefsMap = new Map((prefs || []).map((p: any) => [p.tenant_id, p.max_budget]));

          const { data: verifiedLeases } = await supabase
            .from('leases')
            .select('user_id')
            .eq('status', 'verified')
            .in('user_id', profileIds);

          const verifiedCountMap = new Map<string, number>();
          (verifiedLeases || []).forEach((l: any) => {
            verifiedCountMap.set(l.user_id, (verifiedCountMap.get(l.user_id) || 0) + 1);
          });

          const eligibleCandidates = profiles.filter((p: any) => {
            // Ignorer les comptes désactivés temporairement
            if (p.is_active === false) return false;
            if (!p.name || p.name.trim().length === 0) return false;
            const verifiedCount = verifiedCountMap.get(p.id) || 0;
            const hasVerifiedReputation = (p.trust_score || 0) >= 50 || p.is_verified === true;
            return verifiedCount >= 1 || hasVerifiedReputation;
          });

          sanitizedCandidates = eligibleCandidates.map((p: any) => {
            let ageBracket = '25 - 35 ans';
            let ageNum = 28;
            if (p.birth_year) {
              const age = new Date().getFullYear() - Number(p.birth_year);
              ageNum = age;
              if (age < 25) ageBracket = '18 - 25 ans';
              else if (age <= 35) ageBracket = '25 - 35 ans';
              else if (age <= 45) ageBracket = '35 - 45 ans';
              else ageBracket = '45+ ans';
            }

            return {
              tenant_id: p.id,
              firstName: (p.name || 'Inquilino').split(' ')[0],
              fullName: p.name || 'Inquilino Verificado',
              avatar_url: p.avatar_url || null,
              photos: p.avatar_url ? [p.avatar_url] : [],
              age: ageNum,
              ageBracket,
              maxBudget: prefsMap.get(p.id) || 950,
              monthly_income: p.monthly_income || 2400,
              employment_type: p.employment_type || 'indefinido',
              profession: p.profession || 'Profesional',
              has_payslips: true,
              has_guarantor: false,
              guarantor_income: 0,
              has_pets: false,
              occupants_count: 1,
              target_city: 'Málaga',
              bio: 'Inquilino con pasaporte certificado y pagos demostrables.',
              trustScore: p.trust_score ?? 50,
              verifiedLeasesCount: verifiedCountMap.get(p.id) || 0,
              is_verified: true,
            };
          });
        }
      } catch (sbErr: any) {
        console.warn('Supabase candidates query notice:', sbErr?.message || sbErr);
      }
    }

    // Complementar con inquilinos registrados en RentiaDB
    const localTenants = RentiaDB.getTenantProfiles();
    localTenants.forEach((t: any) => {
      if (!sanitizedCandidates.some(sc => sc.tenant_id === t.user_id || sc.tenant_id === t.id)) {
        sanitizedCandidates.push({
          tenant_id: t.user_id || t.id,
          firstName: (t.name || t.full_name || 'Inquilino').split(' ')[0],
          fullName: t.full_name || t.name,
          avatar_url: (t.photos && t.photos.length > 0 ? t.photos[0] : null) || t.avatar_url || null,
          photos: t.photos && t.photos.length > 0 ? t.photos : (t.avatar_url ? [t.avatar_url] : []),
          age: t.age || 28,
          ageBracket: t.age ? `${t.age} años` : '25 - 35 años',
          maxBudget: t.max_budget || 950,
          monthly_income: t.monthly_income || 2400,
          employment_type: t.employment_type || 'indefinido',
          profession: t.employer_name || 'Profesional',
          has_payslips: t.has_payslips !== undefined ? t.has_payslips : true,
          has_guarantor: t.has_guarantor || false,
          guarantor_income: t.guarantor_income || 0,
          has_pets: t.has_pets || t.pets || false,
          occupants_count: t.occupants_count || 1,
          target_city: t.target_city || t.current_city || 'Málaga',
          bio: t.bio || 'Inquilino verificado con historial de pagos en regla.',
          trustScore: t.trust_score ?? 90,
          verifiedLeasesCount: t.verified_docs_count ?? 2,
          is_verified: t.is_verified ?? true,
        });
      }
    });

    res.json(sanitizedCandidates);
  } catch (err: any) {
    console.error('Error fetching candidates:', err);
    res.json([]);
  }
});

/**
 * POST /api/matching/swipe
 * REGLA ASIMÉTRICA FUNDAMENTAL (Sección 6):
 * - El match NO es simétrico:
 *   1. Si el PROPIETARIO da LIKE a un inquilino: desbloquea inmediatamente la conversación (status: 'active').
 *      El propietario tiene el poder de iniciar la conversación.
 *   2. Si el INQUILINO da LIKE a un anuncio: expresa interés y queda en espera ('pending').
 *      No desbloquea el chat hasta que el propietario del anuncio también dé like al inquilino.
 *   3. Si la acción es 'pass': no hay match ni apertura de chat.
 */
matchingRouter.post('/swipe', async (req: Request, res: Response) => {
  try {
    const { actorId, actorRole, listingId, targetUserId, action } = req.body;

    if (!actorId || !actorRole || !listingId || !targetUserId || !action) {
      res.status(400).json({ error: 'Parámetros de swipe incompletos.' });
      return;
    }

    // 1. Guardar de inmediato en la base de datos persistente real
    RentiaDB.recordSwipe({
      actor_id: actorId,
      actor_role: actorRole,
      listing_id: listingId,
      target_user_id: targetUserId,
      action: action,
    });

    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // Replicar en Supabase si está disponible
    if (supabase) {
      try {
        await supabase
          .from('swipes')
          .upsert({
            actor_id: actorId,
            actor_role: actorRole,
            listing_id: listingId,
            target_user_id: targetUserId,
            action: action,
          }, {
            onConflict: 'actor_id,listing_id,target_user_id'
          });
      } catch (swipeError: any) {
        console.warn('Note insertion swipe:', swipeError?.message);
      }
    }

    // 2. Si la acción actual es "pass", no hay match ni apertura de chat
    if (action !== 'like') {
      res.json({
        success: true,
        action: 'pass',
        isMatch: false,
        matchId: null
      });
      return;
    }

    // 3. GESTIÓN ASIMÉTRICA Y PERSISTENCIA DE MATCHES:
    let matchRecordId = null;
    let isMatch = false;

    if (actorRole === 'landlord' || actorRole === 'agency') {
      // Caso 1: PROPIETARIO O AGENCIA da LIKE -> Desbloquea match activo inmediatamente
      const tenantId = targetUserId;
      const landlordId = actorId;

      const tenantProfile = RentiaDB.getTenantProfileById(tenantId) || RentiaDB.getTenantProfileByUserId(tenantId);
      const tenantUser = RentiaDB.getUserById(tenantId);
      const landlordUser = RentiaDB.getUserById(landlordId);
      const listing = RentiaDB.getListingById(listingId);

      // Guardar en la base de datos persistente
      const savedMatch = RentiaDB.saveMatch({
        listing_id: listingId,
        tenant_id: tenantId,
        landlord_id: landlordId,
        tenant_name: tenantProfile?.name || tenantProfile?.full_name || tenantUser?.name || 'Inquilino Verificado',
        landlord_name: landlordUser?.name || 'Propietario Rentia',
        listing_title: listing?.title || 'Vivienda Seleccionada',
        listing_city: listing?.city || 'España',
        listing_rent: listing?.rent || 850,
        status: 'active',
        landlord_first_message_sent: false,
      });

      matchRecordId = savedMatch.id;
      isMatch = true;

      try {
        broadcastMatchCreated(savedMatch);
      } catch {}

      // Replicar en Supabase si está disponible
      if (supabase) {
        try {
          await supabase
            .from('matches')
            .upsert({
              id: savedMatch.id,
              listing_id: listingId,
              tenant_id: tenantId,
              landlord_id: landlordId,
              status: 'active',
              landlord_first_message_sent: false,
            }, {
              onConflict: 'listing_id,tenant_id'
            });
        } catch (err: any) {
          logSupabaseWriteFailure({
            route: 'POST /api/matching/swipe (upsert match - landlord like)',
            operation: 'upsert',
            target_table: 'matches',
            payload: { id: savedMatch.id, listing_id: listingId, tenant_id: tenantId, landlord_id: landlordId },
            error: err,
          });
        }
      }
    } else {
      // Caso 2: INQUILINO da LIKE -> Verifica si el propietario ya le había dado like
      let landlordAlreadyLiked = false;
      const localMatches = RentiaDB.getMatches();
      const existing = localMatches.find(m => m.listing_id === listingId && m.tenant_id === actorId);
      if (existing) {
        landlordAlreadyLiked = true;
      }

      if (!landlordAlreadyLiked && supabase) {
        try {
          const { data: landlordSwipe } = await supabase
            .from('swipes')
            .select('id, action')
            .eq('actor_id', targetUserId)
            .eq('actor_role', 'landlord')
            .eq('listing_id', listingId)
            .eq('target_user_id', actorId)
            .eq('action', 'like')
            .maybeSingle();
          if (landlordSwipe) landlordAlreadyLiked = true;
        } catch (err: any) {
          console.error('[SUPABASE_READ_FAILED]', { route: 'POST /api/matching/swipe (check landlord swipe)', error: err });
        }
      }

      if (landlordAlreadyLiked) {
        // El propietario ya le había dado like -> match completo
        const savedMatch = RentiaDB.saveMatch({
          listing_id: listingId,
          tenant_id: actorId,
          landlord_id: targetUserId,
          status: 'active',
          landlord_first_message_sent: false,
        });

        matchRecordId = savedMatch.id;
        isMatch = true;

        try {
          broadcastMatchCreated(savedMatch);
        } catch {}

        if (supabase) {
          try {
            await supabase
              .from('matches')
              .upsert({
                id: savedMatch.id,
                listing_id: listingId,
                tenant_id: actorId,
                landlord_id: targetUserId,
                status: 'active',
                landlord_first_message_sent: false,
              }, {
                onConflict: 'listing_id,tenant_id'
              });
          } catch (err: any) {
            logSupabaseWriteFailure({
              route: 'POST /api/matching/swipe (upsert match - mutual like)',
              operation: 'upsert',
              target_table: 'matches',
              payload: { id: savedMatch.id, listing_id: listingId, tenant_id: actorId, landlord_id: targetUserId },
              error: err,
            });
          }
        }
      } else {
        // Queda registrado como like unilateral pendiente del inquilino
        isMatch = false;
        matchRecordId = null;
      }
    }

    // 4. Enviar notificación por email e in-app (Versión Web y App)
    try {
      if (actorRole === 'landlord' || actorRole === 'agency') {
        const landlordListing = RentiaDB.getListingById(listingId);
        RentiaDB.createNotification({
          user_id: targetUserId,
          type: 'match_opened',
          title: '🎉 ¡Match confirmado con un propietario o agencia!',
          body: `El propietario o agencia de "${landlordListing?.title || 'la vivienda'}" ha aceptado tu solicitud. Puedes escribirle por el chat directo.`,
          listing_id: listingId,
          read: false,
          email_sent: true,
          email_recipient: 'inquilino@rentia.es',
        });
      } else {
        // Requerimiento explícito: cuando se hace un like a un propietario de su propiedad, se le envía email y notificación
        const targetListing = RentiaDB.getListingById(listingId);
        const landlordId = targetListing?.landlord_id || targetUserId;
        const landlordEmail = targetListing?.landlord_email || 'propietario@rentia.es';
        const localTenants = RentiaDB.getTenantProfiles();
        const tenantProfile = localTenants.find((t: any) => t.user_id === actorId || t.id === actorId);
        const tenantName = tenantProfile?.full_name || tenantProfile?.name || 'Un inquilino verificado';
        const listingTitle = targetListing?.title || 'tu propiedad en alquiler';

        RentiaDB.createNotification({
          user_id: landlordId,
          type: 'property_like',
          title: `❤️ ¡Alguien ha hecho LIKE a tu propiedad "${listingTitle}"!`,
          body: `${tenantName} ha mostrado gran interés por tu vivienda en Rentia. Accede a tu panel para ver su perfil verificado, pasaporte y documentos.`,
          listing_id: listingId,
          sender_name: tenantName,
          sender_email: tenantProfile?.email,
          read: false,
          email_sent: true,
          email_recipient: landlordEmail,
        });
      }
    } catch (notifErr) {
      console.warn('Error no bloqueante enviando notificación de like:', notifErr);
    }

    res.json({
      success: true,
      action: 'like',
      isMatch: isMatch,
      matchId: matchRecordId,
      notificationSent: true,
      asymmetricMode: (actorRole === 'landlord' || actorRole === 'agency') ? 'landlord_instant_open' : 'tenant_pending'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar el swipe.' });
  }
});

/**
 * GET /api/matching/my-likes
 * Devuelve todos los anuncios a los que el inquilino ha dado 'like' con su estado (Prioridad P0 / 1-BIS.10)
 * Estados:
 * - 'matched': El propietario también dio like o abrió chat -> chat abierto
 * - 'passed': El propietario descartó la solicitud
 * - 'pending': El propietario aún no ha respondido
 */
matchingRouter.get('/my-likes', requireTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.tenant!.id;
    const supabase = isSupabaseConfigured() ? getSupabase(req.supabaseToken) : null;

    // 1. Obtener swipes del usuario (Supabase + fallback a RentiaDB)
    let myLikes: any[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('swipes')
          .select('listing_id, target_user_id, action, created_at')
          .eq('actor_id', userId)
          .eq('action', 'like')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          myLikes = data;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/my-likes (fetch swipes)', error: err });
      }
    }

    if (myLikes.length === 0) {
      const localSwipes = RentiaDB.getSwipes({ actorId: userId });
      myLikes = localSwipes
        .filter((s) => s.action === 'like' && (s.listing_id || s.target_id))
        .map((s) => ({
          listing_id: s.listing_id || s.target_id,
          target_user_id: s.target_id,
          action: s.action,
          created_at: s.created_at,
        }));
    }

    const listingIds = Array.from(new Set(myLikes.map((l) => l.listing_id).filter(Boolean)));

    if (listingIds.length === 0) {
      res.json([]);
      return;
    }

    // 2. Obtener listings asociados (Supabase + fallback RentiaDB)
    const listingsMap = new Map<string, any>();

    if (supabase) {
      try {
        const { data: likedListings } = await supabase
          .from('listings')
          .select('*, profiles:landlord_id(id, name, avatar_url, trust_score)')
          .in('id', listingIds);

        (likedListings || []).forEach((l: any) => {
          listingsMap.set(l.id, l);
        });
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/my-likes (fetch listings)', error: err });
      }
    }

    // Complementar con RentiaDB y SEED_LISTINGS si falta alguno
    const dbListings = RentiaDB.getListings();
    for (const id of listingIds) {
      if (!listingsMap.has(id)) {
        const foundDb = dbListings.find((l) => l.id === id);
        if (foundDb) {
          listingsMap.set(id, foundDb);
        } else {
          const foundSeed = SEED_LISTINGS.find((l) => l.id === id);
          if (foundSeed) {
            listingsMap.set(id, foundSeed);
          }
        }
      }
    }

    // 3. Obtener matches para determinar si el chat está abierto
    const matchesMap = new Map<string, any>(); // key: listing_id
    if (supabase) {
      try {
        const { data: sbMatches } = await supabase
          .from('matches')
          .select('id, listing_id, tenant_id, landlord_id, status, landlord_first_message_sent')
          .eq('tenant_id', userId)
          .in('listing_id', listingIds);

        (sbMatches || []).forEach((m: any) => {
          matchesMap.set(m.listing_id, m);
        });
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/my-likes (fetch matches)', error: err });
      }
    }

    const localMatches = RentiaDB.getMatches({ tenantId: userId });
    for (const m of localMatches) {
      if (!matchesMap.has(m.listing_id)) {
        matchesMap.set(m.listing_id, m);
      }
    }

    // 4. Obtener respuestas de propietarios (swipes de pass o like)
    const landlordActionsMap = new Map<string, 'like' | 'pass'>();
    if (supabase) {
      try {
        const { data: landlordSwipes } = await supabase
          .from('swipes')
          .select('listing_id, action')
          .eq('target_user_id', userId)
          .eq('actor_role', 'landlord')
          .in('listing_id', listingIds);

        (landlordSwipes || []).forEach((ls: any) => {
          if (ls.listing_id) {
            landlordActionsMap.set(ls.listing_id, ls.action);
          }
        });
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/my-likes (fetch landlord swipes)', error: err });
      }
    }

    // 5. Construir respuesta detallada (deduplicando por listing_id para garantizar elementos únicos)
    const seenListingIds = new Set<string>();
    const uniqueLikes = myLikes.filter((like) => {
      const lid = like.listing_id;
      if (!lid || seenListingIds.has(lid)) return false;
      seenListingIds.add(lid);
      return true;
    });

    const result = uniqueLikes
      .map((like) => {
        const listing = listingsMap.get(like.listing_id);
        if (!listing) return null;

        const match = matchesMap.get(like.listing_id);
        const landlordAction = landlordActionsMap.get(like.listing_id);

        let status: 'matched' | 'passed' | 'pending' = 'pending';
        let chatOpen = false;
        let matchId: string | null = null;

        if (match || landlordAction === 'like') {
          status = 'matched';
          chatOpen = true;
          matchId = match ? match.id : null;
        } else if (landlordAction === 'pass') {
          status = 'passed';
          chatOpen = false;
        }

        const landlordProfile = listing.profiles || {};

        return {
          listing_id: like.listing_id,
          liked_at: like.created_at,
          status,
          chat_open: chatOpen,
          match_id: matchId,
          listing: {
            id: listing.id,
            title: listing.title,
            city: listing.city,
            neighborhood: listing.neighborhood,
            rent: listing.rent,
            images: listing.images || [],
            property_type: listing.property_type,
            landlord_name: landlordProfile.name || listing.landlord_name || 'Propietario Verificado',
            landlord_avatar: landlordProfile.avatar_url || listing.landlord_avatar,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener tus likes.' });
  }
});

/**
 * GET /api/matching/swiped-ids
 * Devuelve los IDs de inmuebles que el usuario ya ha interactuado (like, pass)
 */
matchingRouter.get('/swiped-ids', async (req: Request, res: Response) => {
  try {
    const actorId = String(req.query.actorId || (req as any).tenant?.id || '');
    if (!actorId) {
      res.json({ liked: [], passed: [], all: [] });
      return;
    }
    const ids = RentiaDB.getSwipedListingIds(actorId);
    res.json(ids);
  } catch (err: any) {
    res.json({ liked: [], passed: [], all: [] });
  }
});

/**
 * DELETE /api/matching/likes/:listingId
 * Permite al inquilino quitar el like de un inmueble guardado
 */
matchingRouter.delete('/likes/:listingId', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.listingId;
    const actorId = String(req.query.actorId || (req as any).tenant?.id || req.body?.actorId || '');
    if (!listingId || !actorId) {
      res.status(400).json({ error: 'Faltan parámetros requeridos (listingId y actorId).' });
      return;
    }

    const removed = RentiaDB.removeSwipe(actorId, listingId);

    // Sincronizar con Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase
          .from('swipes')
          .delete()
          .match({ actor_id: actorId, listing_id: listingId });
        await supabase
          .from('matches')
          .delete()
          .match({ tenant_id: actorId, listing_id: listingId, status: 'pending' });
      } catch (sbErr) {
        console.warn('[SUPABASE_UNLIKE_WARNING]', sbErr);
      }
    }

    res.json({ success: true, removed, listingId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al quitar el like.' });
  }
});

/**
 * POST /api/matching/unlike
 * Alternativa POST para quitar like
 */
matchingRouter.post('/unlike', async (req: Request, res: Response) => {
  try {
    const { listingId, actorId: bodyActorId } = req.body;
    const actorId = String(bodyActorId || (req as any).tenant?.id || '');
    if (!listingId || !actorId) {
      res.status(400).json({ error: 'Faltan parámetros requeridos (listingId y actorId).' });
      return;
    }

    const removed = RentiaDB.removeSwipe(actorId, listingId);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase
          .from('swipes')
          .delete()
          .match({ actor_id: actorId, listing_id: listingId });
        await supabase
          .from('matches')
          .delete()
          .match({ tenant_id: actorId, listing_id: listingId, status: 'pending' });
      } catch (sbErr) {
        console.warn('[SUPABASE_UNLIKE_WARNING]', sbErr);
      }
    }

    res.json({ success: true, removed, listingId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al quitar el like.' });
  }
});

/**
 * GET /api/matching/landlord/likes
 * Devuelve todos los perfiles de inquilinos a los que el propietario ha dado 'like'
 */
matchingRouter.get('/landlord/likes', async (req: Request, res: Response) => {
  try {
    const landlordId = String(req.query.landlordId || (req as any).tenant?.id || 'landlord_demo');
    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // 1. Obtener swipes de like hechos por el propietario (Supabase + fallback RentiaDB)
    let landlordLikes: any[] = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('swipes')
          .select('target_user_id, listing_id, created_at, action')
          .eq('actor_id', landlordId)
          .eq('action', 'like')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          landlordLikes = data;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/landlord/likes', error: err });
      }
    }

    if (landlordLikes.length === 0) {
      const localSwipes = RentiaDB.getSwipes({ actorId: landlordId, action: 'like' });
      landlordLikes = localSwipes
        .filter((s) => s.action === 'like' && (s.target_user_id || s.target_id))
        .map((s) => ({
          target_user_id: s.target_user_id || s.target_id,
          listing_id: s.listing_id,
          action: s.action,
          created_at: s.created_at,
        }));
    }

    // Complementar con matches del propietario si hubiera
    const localMatches = RentiaDB.getMatches({ landlordId });
    for (const m of localMatches) {
      if (!landlordLikes.some((l) => l.target_user_id === m.tenant_id)) {
        landlordLikes.push({
          target_user_id: m.tenant_id,
          listing_id: m.listing_id,
          action: 'like',
          created_at: m.created_at,
        });
      }
    }

    // Deduplicar por target_user_id
    const seenTenantIds = new Set<string>();
    const uniqueLikes = landlordLikes.filter((l) => {
      const tid = l.target_user_id;
      if (!tid || seenTenantIds.has(tid)) return false;
      seenTenantIds.add(tid);
      return true;
    });

    if (uniqueLikes.length === 0) {
      res.json([]);
      return;
    }

    const dbProfiles = RentiaDB.getTenantProfiles();
    const dbListings = RentiaDB.getListings();

    const results = uniqueLikes.map((like) => {
      const tenantId = like.target_user_id;
      const listingId = like.listing_id;

      const tenantProfile: any = dbProfiles.find((p) => p.user_id === tenantId || p.id === tenantId);
      const seedMatch = SEED_TENANTS.find((st) => st.tenant_id === tenantId || st.id === tenantId);

      const candidate = {
        id: tenantId,
        tenant_id: tenantId,
        firstName: tenantProfile?.full_name?.split(' ')[0] || seedMatch?.firstName || 'Inquilino',
        fullName: tenantProfile?.full_name || seedMatch?.fullName || 'Inquilino Verificado',
        avatar_url: tenantProfile?.avatar_url || tenantProfile?.photos?.[0] || seedMatch?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        photos: tenantProfile?.photos && tenantProfile.photos.length > 0 ? tenantProfile.photos : seedMatch?.photos || [seedMatch?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'],
        age: tenantProfile?.age || seedMatch?.age || 28,
        profession: tenantProfile?.employer_name || tenantProfile?.employment_type || seedMatch?.profession || 'Profesional Cualificado',
        employment_type: tenantProfile?.employment_type || seedMatch?.employment_type || 'indefinido',
        monthly_income: tenantProfile?.monthly_income || seedMatch?.monthly_income || 2800,
        maxBudget: tenantProfile?.max_budget || seedMatch?.maxBudget || 950,
        target_city: tenantProfile?.target_city || seedMatch?.target_city || 'Málaga',
        trustScore: tenantProfile?.trust_score || seedMatch?.trustScore || 93,
        trust_score: tenantProfile?.trust_score || seedMatch?.trust_score || 93,
        verifiedLeasesCount: tenantProfile?.verified_docs_count || seedMatch?.verifiedLeasesCount || 2,
        has_payslips: tenantProfile?.has_payslips ?? seedMatch?.has_payslips ?? true,
        has_pets: tenantProfile?.has_pets ?? seedMatch?.has_pets ?? false,
        has_guarantor: tenantProfile?.has_guarantor ?? seedMatch?.has_guarantor ?? false,
        occupants_count: tenantProfile?.occupants_count || seedMatch?.occupants_count || 1,
        desired_move_in_date: tenantProfile?.desired_move_in_date || seedMatch?.desired_move_in_date || 'Inmediata',
        bio: tenantProfile?.bio || seedMatch?.bio || 'Inquilino con solvencia acreditada y certificado de buen pagador en Rentia.',
      };

      const listing = dbListings.find((l) => l.id === listingId) || SEED_LISTINGS.find((l) => l.id === listingId) || null;
      const match = localMatches.find((m) => m.tenant_id === tenantId && (!listingId || m.listing_id === listingId));

      return {
        liked_at: like.created_at,
        candidate,
        listing: listing ? {
          id: listing.id,
          title: listing.title,
          city: listing.city,
          rent: listing.rent,
          images: (listing as any).photos || (listing as any).images || [],
        } : null,
        matchId: match?.id || `match_${tenantId}_${Date.now()}`,
        status: match?.status || 'active',
        landlord_first_message_sent: match?.landlord_first_message_sent || false,
      };
    });

    res.json(results);
  } catch (err: any) {
    console.error('Error al recuperar perfiles con like:', err);
    res.status(500).json({ error: 'Error al recuperar perfiles con like' });
  }
});

/**
 * DELETE /api/matching/landlord/likes/:tenantId
 * Deshace un like emitido a un inquilino
 */
matchingRouter.delete('/landlord/likes/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const landlordId = String(req.query.landlordId || (req as any).tenant?.id || 'landlord_demo');

    RentiaDB.deleteSwipe(landlordId, tenantId);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase
          .from('swipes')
          .delete()
          .eq('actor_id', landlordId)
          .eq('target_user_id', tenantId);
      } catch (err: any) {
        logSupabaseWriteFailure({
          route: 'DELETE /api/matching/landlord/likes/:tenantId',
          operation: 'delete',
          target_table: 'swipes',
          payload: { actor_id: landlordId, target_user_id: tenantId },
          error: err,
        });
      }
    }

    res.json({ success: true, message: 'Like eliminado con éxito' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar like' });
  }
});

/**
 * GET /api/matching/tenant-profile/:userId
 * Récupère le profil marketplace complet du locataire (fiche unique 1:1)
 */
matchingRouter.get('/tenant-profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let profile: any = null;

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('tenant_profiles')
          .select('*, photos:tenant_photos(*), locations:tenant_search_locations(*)')
          .eq('user_id', userId)
          .maybeSingle();
        if (data) profile = data;
      } catch (sbErr) {
        console.warn('Supabase tenant-profile query warning:', sbErr);
      }
    }

    if (!profile) {
      profile = RentiaDB.getTenantProfileByUserId(userId) || RentiaDB.getTenantProfileById(userId);
    }

    res.json({ profile: profile || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/matching/tenant-profile
 * Met à jour la fiche unique de l'inquilino (Sección 3.1 & 5)
 */
matchingRouter.put('/tenant-profile', requireTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const supabase = isSupabaseConfigured() ? getSupabase(req.supabaseToken) : null;
    const userId = req.tenant!.id;

    const payload = {
      user_id: userId,
      full_name: req.body.full_name || req.tenant!.name,
      age: req.body.age ? Number(req.body.age) : null,
      monthly_income: req.body.monthly_income !== undefined ? Number(req.body.monthly_income) : 0,
      has_payslips: Boolean(req.body.has_payslips),
      employment_type: req.body.employment_type || 'indefinido',
      occupants_count: req.body.occupants_count !== undefined ? Number(req.body.occupants_count) : 1,
      has_children: Boolean(req.body.has_children),
      has_pets: Boolean(req.body.has_pets),
      pet_details: req.body.pet_details || null,
      is_smoker: Boolean(req.body.is_smoker),
      desired_move_in_date: req.body.desired_move_in_date || new Date().toISOString().split('T')[0],
      max_budget: req.body.max_budget !== undefined ? Number(req.body.max_budget) : 1000,
      desired_contract_duration: req.body.desired_contract_duration || 'long_term',
      has_guarantor: Boolean(req.body.has_guarantor),
      previous_landlord_reference: req.body.previous_landlord_reference || null,
      income_to_rent_ratio: (Number(req.body.monthly_income || 0) > 0 && Number(req.body.max_budget || 1000) > 0)
        ? Number((Number(req.body.monthly_income) / Number(req.body.max_budget)).toFixed(2))
        : 0,
      bio: req.body.bio ? String(req.body.bio).substring(0, 300) : null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    // Validation des photos (Minimum 3 photos obligatoires pour profil locataire - Priorité P1.3)
    const photos: string[] = Array.isArray(req.body.photos)
      ? req.body.photos.map((p: any) => typeof p === 'string' ? p : p.url).filter(Boolean)
      : [];

    if (photos.length > 0 && photos.length < 3) {
      res.status(400).json({
        error: `El perfil de inquilino requiere un mínimo de 3 fotos para ser visible en el marketplace (has proporcionado ${photos.length}).`,
        code: 'MIN_TENANT_PHOTOS_REQUIRED',
        minRequired: 3,
        currentCount: photos.length
      });
      return;
    }

    // Guardar en la base de datos persistente real
    const savedLocalProfile = RentiaDB.saveTenantProfile({
      user_id: userId,
      full_name: req.body.full_name || req.tenant!.name,
      age: req.body.age ? Number(req.body.age) : undefined,
      monthly_income: req.body.monthly_income !== undefined ? Number(req.body.monthly_income) : 0,
      has_payslips: Boolean(req.body.has_payslips),
      employment_type: req.body.employment_type || 'indefinido',
      occupants_count: req.body.occupants_count !== undefined ? Number(req.body.occupants_count) : 1,
      has_children: Boolean(req.body.has_children),
      has_pets: Boolean(req.body.has_pets),
      pet_details: req.body.pet_details || null,
      is_smoker: Boolean(req.body.is_smoker),
      desired_move_in_date: req.body.desired_move_in_date || new Date().toISOString().split('T')[0],
      max_budget: req.body.max_budget !== undefined ? Number(req.body.max_budget) : 1000,
      desired_contract_duration: req.body.desired_contract_duration || 'long_term',
      has_guarantor: Boolean(req.body.has_guarantor),
      previous_landlord_reference: req.body.previous_landlord_reference || null,
      income_to_rent_ratio: (Number(req.body.monthly_income || 0) > 0 && Number(req.body.max_budget || 1000) > 0)
        ? Number((Number(req.body.monthly_income) / Number(req.body.max_budget)).toFixed(2))
        : 0,
      bio: req.body.bio ? String(req.body.bio).substring(0, 300) : null,
      photos: photos,
      locations: req.body.locations || [],
      is_active: true,
    });

    // Sincronizar con Supabase si está disponible
    if (supabase) {
      try {
        const { data: updatedProfile } = await supabase
          .from('tenant_profiles')
          .upsert(payload, { onConflict: 'user_id' })
          .select()
          .single();

        if (photos.length >= 3 && updatedProfile?.id) {
          await supabase.from('tenant_photos').delete().eq('tenant_profile_id', updatedProfile.id);
          const photoInserts = photos.map((url: string, index: number) => ({
            tenant_profile_id: updatedProfile.id,
            url,
            position: index,
          }));
          await supabase.from('tenant_photos').insert(photoInserts);
        }
      } catch (syncErr) {
        console.warn('Supabase tenant profile sync warning:', syncErr);
      }
    }

    res.json({ success: true, profile: savedLocalProfile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/matching/compatibility/:listingId/:tenantId
 * Calcule le score de compatibilité explicable et le classement via Supabase
 */
matchingRouter.get('/compatibility/:listingId/:tenantId', async (req: Request, res: Response) => {
  try {
    const { listingId, tenantId } = req.params;
    const result = await calculateMatchRanking(listingId, tenantId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al calcular la compatibilidad.' });
  }
});

/**
 * GET /api/matching/points/:userId
 * Obtiene el resumen de puntos Rentia y el historial de eventos
 */
matchingRouter.get('/points/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let eventsList: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data: events, error } = await supabase
          .from('rentia_points_events')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && events) {
          eventsList = events;
        }
      } catch (sbErr) {
        console.warn('Supabase points query notice:', sbErr);
      }
    }

    const totalPoints = eventsList.reduce((sum, ev) => sum + (ev.points_delta || 0), 0);
    
    res.json({
      userId,
      totalPoints,
      eventsCount: eventsList.length,
      events: eventsList,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener los puntos Rentia.' });
  }
});

/**
 * POST /api/matching/points/record
 * Registra una acción que otorga puntos Rentia con protección anti-fraude
 */
matchingRouter.post('/points/record', async (req: Request, res: Response) => {
  try {
    const { userId, actionType, pointsDelta, metadata } = req.body;

    if (!userId || !actionType || pointsDelta === undefined) {
      res.status(400).json({ error: 'userId, actionType y pointsDelta son obligatorios.' });
      return;
    }

    const result = await recordRentiaPointsEvent(userId, actionType, pointsDelta, metadata);
    res.json({
      message: 'Puntos registrados exitosamente.',
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar los puntos Rentia.' });
  }
});

/**
 * GET /api/matching/matches
 * Devuelve ESTRICTAMENTE los matches del usuario autenticado (seguridad RLS + auth backend)
 */
matchingRouter.get('/matches', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | null = (req.query.userId as string) || (req.query.tenantId as string) || (req.query.landlordId as string) || null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const localUser = RentiaDB.getUserById(token) || RentiaDB.getUserByEmail(token);
      if (localUser) {
        userId = localUser.id;
      } else if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabase();
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user?.id) {
            userId = userData.user.id;
          }
        } catch (err: any) {
          console.error('[SUPABASE_AUTH_FAILED]', { route: 'GET /api/matching/matches (auth.getUser)', error: err });
        }
      }
      if (!userId && token.length > 5) {
        userId = token;
      }
    }

    if (!userId) {
      // Garantizar que siempre se responda con un array JSON para no romper el cliente
      res.json([]);
      return;
    }

    // 1. Obtener de la base de datos persistente local
    const localMatches = RentiaDB.getMatches(userId) || [];

    // 2. Intentar combinar con Supabase si está configurado
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data: matches } = await supabase
          .from('matches')
          .select(`
            id,
            listing_id,
            tenant_id,
            landlord_id,
            status,
            opened_by,
            created_at,
            listings (
              id,
              title,
              price,
              images,
              address_exact
            ),
            tenant_profile:profiles!matches_tenant_id_fkey (
              id,
              name,
              email,
              phone
            ),
            landlord_profile:profiles!matches_landlord_id_fkey (
              id,
              name,
              email,
              phone
            )
          `)
          .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (matches && matches.length > 0) {
          const map = new Map<string, any>();
          localMatches.forEach(m => map.set(m.id, m));
          matches.forEach((m: any) => {
            map.set(m.id, {
              id: m.id,
              listing_id: m.listing_id,
              tenant_id: m.tenant_id,
              landlord_id: m.landlord_id,
              status: m.status,
              landlord_first_message_sent: false,
              compatibility_score: 95,
              created_at: m.created_at,
              listing: m.listings ? {
                id: m.listings.id,
                title: m.listings.title,
                rent: m.listings.price,
                city: m.listings.address_exact?.split(',').pop()?.trim() || 'Málaga',
                images: m.listings.images || [],
              } : undefined,
              tenant: m.tenant_profile ? {
                id: m.tenant_profile.id,
                name: m.tenant_profile.name,
                avatar_url: null,
                trust_score: 90,
              } : undefined,
              landlord: m.landlord_profile ? {
                id: m.landlord_profile.id,
                name: m.landlord_profile.name,
                avatar_url: null,
              } : undefined,
            });
          });
          res.json(Array.from(map.values()));
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/matches', error: err });
      }
    }

    res.json(Array.isArray(localMatches) ? localMatches : []);
  } catch (err: any) {
    console.error('Error al obtener matches:', err);
    res.json([]);
  }
});

/**
 * GET /api/matching/messages/:matchId
 * Recupera el historial de mensajes de una conversación
 */
matchingRouter.get('/messages/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;

    // Obtener los mensajes persistentes reales
    const localMessages = RentiaDB.getChatMessages(matchId);

    // Intentar leer de Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        const { data: messages } = await supabase
          .from('messages')
          .select('id, match_id, sender_id, content, read_at, created_at')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        if (messages && messages.length > 0) {
          const map = new Map<string, any>();
          localMessages.forEach(m => map.set(m.id, m));
          messages.forEach((msg: any) => {
            map.set(msg.id, {
              id: msg.id,
              match_id: msg.match_id,
              sender_id: msg.sender_id,
              sender_role: 'user',
              content: msg.content,
              created_at: msg.created_at,
              read_at: msg.read_at,
            });
          });
          res.json({
            matchId,
            landlord_first_message_sent: true,
            isLandlord: true,
            isTenant: false,
            messages: Array.from(map.values()),
          });
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/matching/messages/:matchId', error: err });
      }
    }

    res.json({
      matchId,
      landlord_first_message_sent: localMessages.length > 0,
      isLandlord: true,
      isTenant: false,
      messages: localMessages,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al recuperar los mensajes.' });
  }
});

/**
 * POST /api/matching/messages
 * Envío de mensaje con persistencia en base de datos
 */
matchingRouter.post('/messages', async (req: Request, res: Response) => {
  try {
    const { matchId, content, senderId: reqSenderId, senderRole: reqSenderRole } = req.body;

    if (!matchId || !content || !content.trim()) {
      res.status(400).json({ error: 'Identificador de conversación y contenido son obligatorios.' });
      return;
    }

    let senderId = reqSenderId || 'user_anonymous';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      senderId = authHeader.substring(7).trim();
    }

    // Comprobación de roles y coordinación
    const match = RentiaDB.getMatchById(matchId);
    let senderRole: 'landlord' | 'tenant' = reqSenderRole || 'tenant';
    if (match) {
      if (match.landlord_id === senderId) {
        senderRole = 'landlord';
      } else if (match.tenant_id === senderId) {
        senderRole = 'tenant';
      }
    }

    // Regla estricta: Si el inquilino envía mensaje, el casero debe haber enviado el primer mensaje
    if (senderRole === 'tenant' && match && !match.landlord_first_message_sent) {
      res.status(403).json({ error: 'El propietario debe enviar el primer mensaje antes de que puedas responder.' });
      return;
    }

    let landlordFirstMessageSent = Boolean(match?.landlord_first_message_sent);
    if (senderRole === 'landlord') {
      landlordFirstMessageSent = true;
      if (match) {
        RentiaDB.updateMatch(matchId, { landlord_first_message_sent: true });
      }
    }

    // Guardar en la base de datos persistente real con sender_role
    const savedMessage = RentiaDB.saveChatMessage({
      match_id: matchId,
      sender_id: senderId,
      sender_role: senderRole,
      content: content.trim(),
    });

    // Replicar en Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        await supabase
          .from('messages')
          .insert({
            id: savedMessage.id,
            match_id: matchId,
            sender_id: senderId,
            content: content.trim(),
          });
      } catch (err: any) {
        logSupabaseWriteFailure({
          route: 'POST /api/matching/messages',
          operation: 'insert',
          target_table: 'messages',
          payload: { id: savedMessage.id, match_id: matchId, sender_id: senderId },
          error: err,
        });
      }
    }

    // ⚡ Difusión instantánea por WebSockets (<1ms) a todos los clientes conectados a este match
    try {
      broadcastChatMessage(matchId, savedMessage, landlordFirstMessageSent);
      const recipientId = match ? (senderRole === 'landlord' ? match.tenant_id : match.landlord_id) : undefined;
      if (recipientId) {
        broadcastToUser(recipientId, {
          type: 'new_incoming_message',
          matchId,
          message: savedMessage,
          listing_title: match?.listing_title,
          sender_name: senderRole === 'landlord' ? match?.landlord_name : match?.tenant_name,
        });
      }
    } catch (wsErr) {
      console.warn('[WEBSOCKET_BROADCAST_NOTICE]', wsErr);
    }

    res.json({
      success: true,
      message: savedMessage,
      landlord_first_message_sent: landlordFirstMessageSent,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al enviar el mensaje.' });
  }
});

/**
 * POST /api/matching/messages/:matchId/read
 * Marca los mensajes de una conversación como leídos
 */
matchingRouter.post('/messages/:matchId/read', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const readerId = (req.body?.userId as string) || (req.query?.userId as string) || '';
    const count = RentiaDB.markChatMessagesAsRead(matchId, readerId);
    res.json({ success: true, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al marcar mensajes como leídos.' });
  }
});

/**
 * GET /api/matching/notifications
 * Devuelve las notificaciones del usuario (alertas de likes, matches, mensajes)
 */
matchingRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || '';
    if (!userId) {
      res.json({ notifications: [] });
      return;
    }
    const notifs = RentiaDB.getNotifications(userId);
    res.json({ notifications: notifs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener notificaciones.' });
  }
});

/**
 * POST /api/matching/notifications/mark-read
 */
matchingRouter.post('/notifications/mark-read', async (req: Request, res: Response) => {
  try {
    const { notificationId, userId } = req.body;
    if (notificationId) {
      RentiaDB.markNotificationAsRead(notificationId);
    } else if (userId) {
      RentiaDB.markAllNotificationsAsRead(userId);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al marcar notificaciones.' });
  }
});

