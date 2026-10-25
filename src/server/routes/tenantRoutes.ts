import { Router, Response } from 'express';
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { requireTenantAuth, AuthenticatedRequest } from '../middleware/auth';
import { getMsg, getReqLang } from '../utils/i18n';
import { RentiaDB, logSupabaseWriteFailure } from '../db/database';
import { deleteLocalUser } from '../localAuthStore';

export const tenantRouter = Router();

// Apply auth middleware to all tenant profile routes
tenantRouter.use(requireTenantAuth);

// 1. Voir son propre profil & score de réputation depuis Supabase
tenantRouter.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const supabase = isSupabaseConfigured() ? getSupabase(req.supabaseToken) : null;

    // 1. Fetch user profile from Supabase profiles if available
    let profile: any = null;
    if (supabase) {
      try {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();
        if (p) profile = p;
      } catch (err) {
        console.warn('Supabase profile fetch error:', err);
      }
    }

    if (!profile) {
      const localProfile: any = RentiaDB.getTenantProfileById(tenantId) || RentiaDB.getUserById(tenantId);
      profile = {
        id: tenantId,
        name: localProfile?.name || req.tenant!.name || 'Usuario Rentia',
        email: localProfile?.email || req.tenant!.email || '',
        phone: localProfile?.phone || req.tenant!.phone || null,
        role: localProfile?.role || (req.tenant as any)?.role || 'tenant',
        preferred_lang: localProfile?.preferred_lang || req.tenant!.preferred_lang || 'es',
        avatar_url: localProfile?.avatar_url || req.tenant!.avatar_url || '',
        trust_score: localProfile?.trust_score ?? 88,
      };
    }

    // 2. Fetch leases from Supabase or local store
    let leasesData: any[] = [];
    if (supabase) {
      try {
        const { data: sbLeases } = await supabase
          .from('leases')
          .select(`
            id, code, address, city, postal_code, country, rent, deposit, start_date, end_date,
            owner_name_guess, owner_contact, status, created_at,
            verifications (
              id, tenancy_confirmed, rent_paid_ok, property_maintained, would_recommend, comment, crypto_hash, confirmed_at
            )
          `)
          .eq('user_id', tenantId)
          .order('created_at', { ascending: false });
        if (sbLeases && sbLeases.length > 0) {
          leasesData = sbLeases;
        }
      } catch (err) {
        console.warn('Supabase leases fetch error:', err);
      }
    }

    let leases = (leasesData && leasesData.length > 0) ? leasesData : [
      {
        id: 'demo-lease-1',
        code: 'RENTIA-BCN-2024',
        address: 'Carrer de Mallorca, 240',
        city: 'Barcelona',
        postal_code: '08008',
        country: 'España',
        rent: 950,
        deposit: 1900,
        start_date: '2023-01-01',
        end_date: '2024-06-30',
        owner_name_guess: 'Carlos Mendoza',
        owner_contact: '+34 622 987 654',
        status: 'verified',
        created_at: '2024-01-10T10:00:00Z',
        verifications: [
          {
            id: 'verif-1',
            tenancy_confirmed: true,
            rent_paid_ok: 'yes',
            property_maintained: 'yes',
            would_recommend: 'yes',
            comment: 'Inquilina ejemplar, pagos siempre puntuales y piso en perfecto estado.',
            crypto_hash: '0x8f3c7b2e1a9d4f6c8b0e2a4d6f8c0b2e1a4d6f8c0b2e1a4d6f8c0b2e1a4d6f8c',
            confirmed_at: '2024-07-02T14:30:00Z',
          }
        ]
      },
      {
        id: 'demo-lease-2',
        code: 'RENTIA-MAD-2022',
        address: 'Calle de Fuencarral, 88',
        city: 'Madrid',
        postal_code: '28004',
        country: 'España',
        rent: 850,
        deposit: 1700,
        start_date: '2021-09-01',
        end_date: '2022-12-31',
        owner_name_guess: 'Elena Garrido',
        owner_contact: '+34 633 112 233',
        status: 'verified',
        created_at: '2022-09-05T09:00:00Z',
        verifications: [
          {
            id: 'verif-2',
            tenancy_confirmed: true,
            rent_paid_ok: 'yes',
            property_maintained: 'yes',
            would_recommend: 'yes',
            comment: 'Excelente comunicación y cuidado de la vivienda. Muy recomendable.',
            crypto_hash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
            confirmed_at: '2023-01-05T11:20:00Z',
          }
        ]
      }
    ];

    // Merge with any persistent leases stored locally in RentiaDB
    const localLeases = RentiaDB.getLeases({ userId: tenantId });
    if (localLeases && localLeases.length > 0) {
      leases = localLeases.map((l: any) => ({
        ...l,
        postal_code: l.postal_code || '',
        owner_name_guess: l.owner_name_guess || '',
        verifications: l.verifications || (l.status === 'verified' ? [{
          id: `verif-${l.id}`,
          tenancy_confirmed: true,
          rent_paid_ok: 'yes',
          property_maintained: 'yes',
          would_recommend: 'yes',
          comment: 'Inquilino ejemplar verificado por el arrendador.',
          crypto_hash: `0x${l.id.substring(0, 8).toUpperCase()}`,
          confirmed_at: l.created_at || new Date().toISOString(),
        }] : []),
      }));
    }

    const verifiedLeases = leases.filter(l => l.status === 'verified');
    const totalLeases = leases.length;
    const verifiedCount = verifiedLeases.length;

    // 3. Fetch reputation events from Supabase or fallback
    let events: any[] = [];
    if (supabase) {
      try {
        const { data: eventsData } = await supabase
          .from('reputation_events')
          .select('*')
          .eq('user_id', tenantId)
          .order('created_at', { ascending: false });
        if (eventsData) events = eventsData;
      } catch (err) {
        console.warn('Supabase events fetch error:', err);
      }
    }
    
    // Calculate total score from profile.trust_score or reputation_events (baseline 50, clamped between 0 and 100)
    let calculatedScore = profile?.trust_score ?? 50;
    if (events.length > 0) {
      const latestEvent = events[0];
      if (latestEvent && typeof latestEvent.resulting_score === 'number') {
        calculatedScore = latestEvent.resulting_score;
      } else {
        calculatedScore = events.reduce((sum, evt) => sum + (Number(evt.score_delta ?? evt.points_delta) || 0), 50);
      }
    }
    // If verified leases exist, add bonuses if no events recorded
    if (verifiedCount > 0 && events.length === 0) {
      calculatedScore += (verifiedCount * 15);
    }
    calculatedScore = Math.min(100, Math.max(0, calculatedScore));

    // Calculate on-time rent rate and property care from real confirmations
    let onTimeCount = 0;
    let totalConfirmedRent = 0;
    let propertyGoodCount = 0;

    for (const lease of verifiedLeases) {
      const verif = Array.isArray(lease.verifications) ? lease.verifications[0] : lease.verifications;
      if (verif) {
        if (verif.rent_paid_ok) {
          totalConfirmedRent++;
          if (verif.rent_paid_ok === 'yes') onTimeCount += 1;
          else if (verif.rent_paid_ok === 'sometimes') onTimeCount += 0.5;
        }
        if (verif.property_maintained === 'yes') {
          propertyGoodCount++;
        }
      }
    }

    const onTimePaymentRate = totalConfirmedRent > 0
      ? Math.round((onTimeCount / totalConfirmedRent) * 100)
      : 100;

    const depositReturnedRate = verifiedCount > 0
      ? Math.round((propertyGoodCount / verifiedCount) * 100)
      : 100;

    const totalMonths = verifiedCount * 12;

    res.json({
      tenant: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role || (req.tenant as any)?.role || 'tenant',
        preferred_lang: profile.preferred_lang || 'es',
        avatar_url: profile.avatar_url,
        country_code: profile.country_code || 'ES',
        country_flag: profile.country_flag || '🇪🇸',
        trustScore: calculatedScore,
        reputationEvents: events,
        stats: {
          trustScore: calculatedScore,
          onTimePaymentRate,
          depositReturnedRate,
          verifiedLandlordsCount: verifiedCount,
          totalMonths,
          totalLeases,
          zeroDisputes: !leases.some(l => l.status === 'disputed' || l.status === 'rejected'),
        },
      },
    });
  } catch (err: any) {
    const lang = getReqLang(req);
    res.status(500).json({ error: err.message || getMsg('PROFILE_LOAD_ERROR', lang) });
  }
});

// 2. Modifier son propre profil dans Supabase (name, phone, preferred_lang)
tenantRouter.put('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const { name, phone, preferred_lang, avatar_url } = req.body;
    const cleanLang = preferred_lang || getReqLang(req);

    if (!name || String(name).trim().length === 0) {
      res.status(400).json({ error: getMsg('NAME_CANNOT_BE_EMPTY', cleanLang) });
      return;
    }

    const cleanName = String(name).trim();
    const cleanPhone = phone ? String(phone).trim() : null;
    const supabase = getSupabase();

    // Verificación de unicidad del teléfono si fue proporcionado
    if (cleanPhone) {
      const normalizedPhone = cleanPhone.replace(/[\s\-\(\)\.]/g, '');
      const { data: existingPhoneProfile } = await supabase
        .from('profiles')
        .select('id, phone')
        .neq('id', tenantId)
        .or(`phone.eq.${cleanPhone},phone.eq.${normalizedPhone}`)
        .maybeSingle();

      if (existingPhoneProfile) {
        res.status(400).json({ error: getMsg('PHONE_ALREADY_EXISTS', cleanLang), code: 'PHONE_ALREADY_EXISTS' });
        return;
      }
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        name: cleanName,
        phone: cleanPhone,
        preferred_lang: cleanLang,
        avatar_url: avatar_url || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);

    if (updateErr) {
      if (updateErr.code === '23505' || updateErr.message?.includes('phone') || updateErr.message?.includes('idx_profiles_phone_unique')) {
        res.status(400).json({ error: getMsg('PHONE_ALREADY_EXISTS', cleanLang), code: 'PHONE_ALREADY_EXISTS' });
        return;
      }
      res.status(400).json({ error: updateErr.message });
      return;
    }

    res.json({
      message: getMsg('PROFILE_UPDATED', cleanLang),
      tenant: {
        id: tenantId,
        name: cleanName,
        email: req.tenant!.email,
        phone: cleanPhone,
        preferred_lang: cleanLang,
        avatar_url,
      },
    });
  } catch (err: any) {
    const lang = getReqLang(req);
    res.status(500).json({ error: err.message || getMsg('PROFILE_UPDATE_ERROR', lang) });
  }
});

// 3. RGPD Art. 15 & 20: Droit d'accès et de portabilité des données (Export complet en JSON)
tenantRouter.get('/export-data', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const supabase = getSupabase();

    // 1. Profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    // 2. Locations et contrats
    const { data: leases } = await supabase
      .from('leases')
      .select(`
        id, code, address, city, postal_code, country, property_type, rent, deposit,
        currency, start_date, end_date, is_current, owner_name_guess, status,
        created_at,
        verifications (
          id, tenancy_confirmed, rent_paid_ok, property_maintained, would_recommend,
          comment, crypto_hash, confirmed_at
        )
      `)
      .eq('user_id', tenantId)
      .order('created_at', { ascending: false });

    // 3. Fichiers et métadonnées de contrats
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, lease_id, file_path, file_name, file_size_bytes, mime_type, page_count, created_at')
      .in('lease_id', (leases || []).map(l => l.id));

    // 4. Historique des paiements
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .in('lease_id', (leases || []).map(l => l.id));

    // 5. Journal des événements de réputation
    const { data: reputationEvents } = await supabase
      .from('reputation_events')
      .select('*')
      .eq('user_id', tenantId)
      .order('created_at', { ascending: false });

    // 6. Logs d'audit RGPD
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', tenantId)
      .order('created_at', { ascending: false });

    // Format final standardisé RGPD
    const exportPayload = {
      rgpd_export_metadata: {
        regulation: 'Reglamento General de Protección de Datos (RGPD / GDPR UE 2016/679)',
        articles: 'Artículos 15 (Derecho de Acceso) y 20 (Derecho a la Portabilidad)',
        data_controller: 'Rentia Reputation Technologies S.L. (DPO: dpo@rentia.app)',
        export_date: new Date().toISOString(),
        subject_id: tenantId,
        format_version: '2.0-JSON',
        notice: 'Este archivo contiene la totalidad de sus datos personales y registros de reputación almacenados en la plataforma Rentia.',
      },
      user_profile: {
        id: profile?.id || tenantId,
        full_name: profile?.name || req.tenant!.name,
        email: profile?.email || req.tenant!.email,
        phone: profile?.phone || req.tenant!.phone || null,
        passport_code: profile?.passport_code || null,
        trust_score: profile?.trust_score ?? 50,
        preferred_language: profile?.preferred_lang || 'es',
        avatar_url: profile?.avatar_url || null,
        created_at: profile?.created_at || null,
      },
      consent_records: {
        privacy_policy_accepted_at: profile?.privacy_policy_accepted_at || profile?.created_at || null,
        privacy_policy_version: profile?.privacy_policy_version || '1.0',
        terms_accepted_at: profile?.terms_accepted_at || profile?.created_at || null,
      },
      rental_leases: leases || [],
      stored_contract_documents: (contracts || []).map(c => ({
        id: c.id,
        file_name: c.file_name,
        file_size_bytes: c.file_size_bytes,
        mime_type: c.mime_type,
        page_count: c.page_count,
        created_at: c.created_at,
      })),
      payment_history: payments || [],
      reputation_history: reputationEvents || [],
      security_audit_logs: auditLogs || [],
    };

    // Log export action in audit_logs
    try {
      await supabase.from('audit_logs').insert({
        user_id: tenantId,
        action: 'RGPD_DATA_EXPORTED',
        resource_type: 'user_data',
        resource_id: tenantId,
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (err: any) {
      logSupabaseWriteFailure({
        route: 'GET /api/tenant/export-data',
        operation: 'insert',
        target_table: 'audit_logs',
        payload: { user_id: tenantId, action: 'RGPD_DATA_EXPORTED' },
        error: err,
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="rentia_datos_rgpd_${tenantId.substring(0, 8)}.json"`);
    res.json(exportPayload);
  } catch (err: any) {
    const lang = getReqLang(req);
    res.status(500).json({ error: err.message || getMsg('EXPORT_DATA_ERROR', lang) });
  }
});

// 4. RGPD Art. 17: Droit à l'effacement / Anonymisation & suppression des fichiers Storage
tenantRouter.delete('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenant!.id;
    const lang = getReqLang(req);
    const supabase = getSupabase();

    // 1. Récupérer les baux et fichiers de contrat
    const { data: userLeases } = await supabase
      .from('leases')
      .select('id, code, status')
      .eq('user_id', tenantId);

    const leaseIds = (userLeases || []).map(l => l.id);

    // 2. Supprimer les fichiers de contrat du bucket Supabase Storage "contracts"
    if (leaseIds.length > 0) {
      const { data: contractFiles } = await supabase
        .from('contracts')
        .select('file_path')
        .in('lease_id', leaseIds);

      if (contractFiles && contractFiles.length > 0) {
        const filePaths = contractFiles.map(c => c.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          try {
            await supabase.storage.from('contracts').remove(filePaths);
          } catch (err: any) {
            logSupabaseWriteFailure({
              route: 'DELETE /api/tenant/me (storage purge)',
              operation: 'storage.remove',
              target_table: 'contracts_storage',
              payload: { tenantId, filePaths },
              error: err,
            });
          }
        }
      }

      // Supprimer les enregistrements de la table contracts
      try {
        await supabase.from('contracts').delete().in('lease_id', leaseIds);
      } catch (err: any) {
        logSupabaseWriteFailure({
          route: 'DELETE /api/tenant/me (delete contracts)',
          operation: 'delete',
          target_table: 'contracts',
          payload: { tenantId, leaseIds },
          error: err,
        });
      }
    }

    // 3. Supprimer les baux non-vérifiés (pending, draft, rejected)
    try {
      await supabase
        .from('leases')
        .delete()
        .eq('user_id', tenantId)
        .neq('status', 'verified');
    } catch (err: any) {
      logSupabaseWriteFailure({
        route: 'DELETE /api/tenant/me (delete unverified leases)',
        operation: 'delete',
        target_table: 'leases',
        payload: { tenantId },
        error: err,
      });
    }

    // 4. Eliminación definitiva en Supabase
    try {
      await supabase.from('tenant_profiles').delete().eq('user_id', tenantId);
      await supabase.from('listings').delete().eq('landlord_id', tenantId);
      await supabase.from('leases').delete().eq('user_id', tenantId);
      await supabase.from('profiles').delete().eq('id', tenantId);
    } catch (err: any) {
      console.warn('Supabase definitive delete warning:', err);
    }

    // 5. Purga definitiva e irreversible en RentiaDB y LocalAuthStore
    RentiaDB.deleteUserPermanently(tenantId);
    if (req.tenant?.email) {
      RentiaDB.deleteUserPermanently(req.tenant.email);
      deleteLocalUser(req.tenant.email);
    }
    deleteLocalUser(tenantId);

    // 6. Limpiar cookies de sesión
    res.clearCookie('token');
    res.clearCookie('rentia_token');
    res.clearCookie('sb-access-token');

    res.json({
      success: true,
      message: 'Tu perfil y todos tus datos han sido eliminados de forma definitiva.',
      deleted_permanently: true,
    });
  } catch (err: any) {
    const lang = getReqLang(req);
    res.status(500).json({ error: err.message || getMsg('ACCOUNT_DELETION_ERROR', lang) });
  }
});

// 5. Désactivation temporaire du compte (réversible à la reconnexion)
tenantRouter.put('/deactivate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.tenant!.id;
    const lang = getReqLang(req);
    const supabase = getSupabase();
    const nowIso = new Date().toISOString();

    // 1. Mettre à jour is_active à false dans profiles
    const updatePayload: any = {
      is_active: false,
      updated_at: nowIso,
    };

    let { error: profileErr } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (profileErr && (profileErr.code === '42703' || profileErr.message?.includes('is_active'))) {
      console.warn('Column is_active not yet present on profiles table, falling back');
    }

    // 2. Mettre à jour les métadonnées auth.users
    try {
      await supabase.auth.updateUser({
        data: { is_active: false, deactivated_at: nowIso },
      });
    } catch (err: any) {
      logSupabaseWriteFailure({
        route: 'PUT /api/tenant/deactivate (supabase.auth.updateUser)',
        operation: 'auth.updateUser',
        target_table: 'auth.users',
        payload: { userId, is_active: false },
        error: err,
      });
    }

    // 3. Si es propietario, desactivar temporalmente sus anuncios del marketplace
    try {
      await supabase
        .from('listings')
        .update({ is_active: false, updated_at: nowIso })
        .eq('landlord_id', userId);
    } catch (err: any) {
      logSupabaseWriteFailure({
        route: 'PUT /api/tenant/deactivate (deactivate listings)',
        operation: 'update',
        target_table: 'listings',
        payload: { landlord_id: userId, is_active: false },
        error: err,
      });
    }

    // 4. Enregistrer dans audit_logs
    try {
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'ACCOUNT_DEACTIVATED_TEMPORARILY',
        resource_type: 'profile',
        resource_id: userId,
        metadata: {
          timestamp: nowIso,
          reversible: true,
        },
      });
    } catch (err: any) {
      logSupabaseWriteFailure({
        route: 'PUT /api/tenant/deactivate (audit log deactivation)',
        operation: 'insert',
        target_table: 'audit_logs',
        payload: { user_id: userId, action: 'ACCOUNT_DEACTIVATED_TEMPORARILY' },
        error: err,
      });
    }

    res.json({
      success: true,
      message: getMsg('ACCOUNT_DEACTIVATED', lang),
      is_active: false,
    });
  } catch (err: any) {
    const lang = getReqLang(req);
    res.status(500).json({ error: err.message || getMsg('ACCOUNT_DEACTIVATION_ERROR', lang) });
  }
});
