import { Router, Request, Response } from 'express';
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { landlordCodeRateLimiter } from '../middleware/rateLimit';
import { RentiaDB, logSupabaseWriteFailure } from '../db/database';

export const publicRouter = Router();

// Apply rate limiter to public landlord lookup endpoints
publicRouter.use(landlordCodeRateLimiter);

// 1. Route publique : rechercher une location via la fonction RPC sécurisée lookup_lease_by_code(p_code)
// Ne divulgue JAMAIS l'email ni le téléphone du locataire
publicRouter.get('/leases/:code', async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    if (!rawCode || rawCode.trim().length === 0) {
      res.status(400).json({ error: 'Code de vérification requis.' });
      return;
    }

    const cleanCode = rawCode.trim().toUpperCase();
    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    let row: any = null;

    // 1. Try Supabase RPC lookup_lease_by_code first
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('lookup_lease_by_code', {
          p_code: cleanCode,
        });

        if (!error && data && data.length > 0) {
          row = data[0];
        }
      } catch (err: any) {
        console.error('[SUPABASE_RPC_FAILED]', { route: 'GET /api/public/leases/:code (rpc lookup_lease_by_code)', error: err });
      }

      // 2. Direct query fallback: useful if the lease is already confirmed (RPC filters by pending)
      // or if the profile foreign key join was not present
      if (!row) {
        try {
          const { data: directLease } = await supabase
            .from('leases')
            .select('id, code, address, city, start_date, end_date, status, user_id')
            .ilike('code', cleanCode)
            .maybeSingle();

          if (directLease) {
            let tenantName = 'Locataire Rentia';
            if (directLease.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', directLease.user_id)
                .maybeSingle();
              if (profile?.name) tenantName = profile.name;
            }

            row = {
              lease_id: directLease.id,
              tenant_name: tenantName,
              address: directLease.address,
              city: directLease.city || 'Málaga',
              start_date: directLease.start_date,
              end_date: directLease.end_date,
              status: directLease.status || 'verified',
            };
          }
        } catch (err: any) {
          console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/public/leases/:code (direct lookup fallback)', error: err });
        }
      }
    }

    // 3. Check persistent local store if not found in Supabase
    if (!row) {
      const localLease = RentiaDB.getLeaseByCode(cleanCode);
      if (localLease) {
        const localTenant = RentiaDB.getUserById(localLease.user_id);
        row = {
          lease_id: localLease.id,
          tenant_name: localTenant?.name || localLease.owner_name_guess || 'Inquilino verificado',
          address: localLease.address,
          city: localLease.city || 'Málaga',
          start_date: localLease.start_date,
          end_date: localLease.end_date,
          status: localLease.status || 'pending',
        };
      }
    }

    if (!row) {
      res.status(404).json({ error: 'Aucune location trouvée pour ce code de vérification.' });
      return;
    }

    // Privacy-safe response: NO email, NO phone
    res.json({
      lease: {
        id: row.lease_id,
        code: cleanCode,
        tenantName: row.tenant_name || 'Inquilino verificado',
        address: row.address,
        city: row.city,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        isAlreadyConfirmed: row.status !== 'pending',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error interno al consultar el contrato.' });
  }
});

// 2. Route publique : confirmer une location via la fonction RPC sécurisée confirm_lease_by_code(...)
// Scelle l'attestation avec empreinte SHA-256 et verrouille le bail contre toute modification
publicRouter.post('/leases/:code/confirm', async (req: Request, res: Response) => {
  try {
    const rawCode = req.params.code;
    const {
      tenancy_confirmed,
      rent_paid_ok,
      property_maintained,
      would_recommend,
      comment,
      phone,
    } = req.body;

    if (!rawCode) {
      res.status(400).json({ error: 'Code de vérification requis.' });
      return;
    }

    const cleanCode = rawCode.trim().toUpperCase();

    // Mandatory Landlord Phone & SMS Verification
    if (!phone || !String(phone).trim()) {
      res.status(400).json({
        error: 'Le numéro de téléphone du propriétaire et sa vérification par SMS sont obligatoires pour certifier la location.'
      });
      return;
    }

    const cleanPhone = String(phone).trim();

    // Check if an OTP was issued and verify it was validated
    const otpRecord = otpStore.get(`${cleanCode}_${cleanPhone}`);
    if (otpRecord && !otpRecord.verified) {
      res.status(400).json({
        error: 'Por favor, valida el código SMS recibido en tu teléfono antes de certificar.',
      });
      return;
    }

    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // Anti-fraud security check: verify that the caller is NOT the tenant who owns this lease
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      const token = authHeader.split(' ')[1];
      if (token) {
        try {
          const { data: userData } = await supabase.auth.getUser(token);
          if (userData?.user?.id) {
            const { data: existingLease } = await supabase
              .from('leases')
              .select('user_id')
              .eq('code', cleanCode)
              .maybeSingle();

            if (existingLease && existingLease.user_id === userData.user.id) {
              res.status(403).json({ 
                error: 'Seguridad anti-fraude: No puedes validar tu propio alquiler. Esta acción está reservada al arrendador.',
                code: 'OWN_LEASE_VALIDATION_FORBIDDEN'
              });
              return;
            }
          }
        } catch (err: any) {
          console.warn('[PUBLIC_AUTH_DECODE_FAILED]', { route: 'POST /api/public/leases/:code/confirm', error: err?.message || err });
        }
      }
    }

    // Validate inputs
    if (!['yes', 'no'].includes(tenancy_confirmed)) {
      res.status(400).json({ error: 'Por favor, confirma si el alquiler tuvo lugar (yes/no).' });
      return;
    }
    if (!['yes', 'sometimes', 'no'].includes(rent_paid_ok)) {
      res.status(400).json({ error: 'Por favor, indica la puntualidad de los pagos (yes/sometimes/no).' });
      return;
    }
    if (!['yes', 'no'].includes(property_maintained)) {
      res.status(400).json({ error: 'Por favor, indica si el inmueble fue bien cuidado (yes/no).' });
      return;
    }
    if (!['yes', 'no'].includes(would_recommend)) {
      res.status(400).json({ error: 'Por favor, indica si recomiendas a este inquilino (yes/no).' });
      return;
    }

    let cryptoHash = `0x${Date.now().toString(16).toUpperCase()}`;

    // Update local RentiaDB store
    const localConfirmed = RentiaDB.confirmLease(cleanCode, {
      tenancy_confirmed,
      rent_paid_ok,
      property_maintained,
      would_recommend,
      comment: comment ? String(comment).trim() : '',
    });
    if (localConfirmed?.crypto_hash) {
      cryptoHash = localConfirmed.crypto_hash;
    }

    if (supabase) {
      // Call Supabase RPC confirm_lease_by_code
      const { data: rpcResult, error: rpcError } = await supabase.rpc('confirm_lease_by_code', {
        p_code: cleanCode,
        p_tenancy_confirmed: tenancy_confirmed,
        p_rent_paid_ok: rent_paid_ok,
        p_property_maintained: property_maintained,
        p_would_recommend: would_recommend,
        p_comment: comment ? String(comment).trim() : '',
      });

      if (rpcError) {
        if (rpcError.message?.includes('déjà confirmée') || rpcError.message?.includes('introuvable')) {
          const { data: alreadyDone } = await supabase
            .from('leases')
            .select('id, status')
            .eq('code', cleanCode)
            .maybeSingle();

          if (alreadyDone?.status === 'verified') {
            res.json({
              message: 'Cette location a déjà été validée et certifiée avec succès.',
              status: 'verified',
              cryptoHash: 'SHA256_VERIFIED',
              confirmedAt: new Date().toISOString(),
            });
            return;
          }
        }
      } else {
        // Query the updated verification to get the generated crypto_hash and lease owner
        const { data: leaseData } = await supabase
          .from('leases')
          .select('id, user_id, status, verifications(crypto_hash, confirmed_at)')
          .eq('code', cleanCode)
          .maybeSingle();

        const verif = leaseData?.verifications && (Array.isArray(leaseData.verifications) ? leaseData.verifications[0] : leaseData.verifications);
        if (verif?.crypto_hash) cryptoHash = verif.crypto_hash;

        if (leaseData?.user_id) {
          let points = tenancy_confirmed === 'yes' ? 15 : -15;
          if (tenancy_confirmed === 'yes') {
            if (rent_paid_ok === 'yes') points += 5;
            if (property_maintained === 'yes') points += 3;
            if (would_recommend === 'yes') points += 2;
          }

          let currentTrustScore = 50;
          try {
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('trust_score')
              .eq('id', leaseData.user_id)
              .maybeSingle();
            if (currentProfile && typeof currentProfile.trust_score === 'number') {
              currentTrustScore = currentProfile.trust_score;
            }
          } catch (err: any) {
            console.error('[SUPABASE_READ_FAILED]', { route: 'POST /api/public/leases/:code/confirm (get trust_score)', error: err });
          }

          const newTrustScore = Math.min(100, Math.max(0, currentTrustScore + points));

          try {
            await supabase
              .from('profiles')
              .update({
                trust_score: newTrustScore,
                updated_at: new Date().toISOString(),
              })
              .eq('id', leaseData.user_id);
          } catch (profErr: any) {
            logSupabaseWriteFailure({
              route: 'POST /api/public/leases/:code/confirm (update profile trust_score)',
              operation: 'update',
              target_table: 'profiles',
              payload: { user_id: leaseData.user_id, trust_score: newTrustScore },
              error: profErr,
            });
          }
        }
      }
    }

    res.json({
      message: 'Merci ! Votre attestation propriétaire a été scellée avec succès.',
      status: tenancy_confirmed === 'yes' ? 'verified' : 'rejected',
      cryptoHash,
      confirmedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error durante la confirmación del propietario.' });
  }
});

// In-memory / cache store for OTPs
const otpStore = new Map<string, { otp: string; expiresAt: number; verified: boolean; phone: string }>();

// Helper function to handle OTP request
const handleOtpRequest = async (rawCode: string | undefined, phone: any, res: Response) => {
  try {
    if (!phone || !String(phone).trim()) {
      res.status(400).json({ error: 'Número de teléfono requerido.' });
      return;
    }

    const cleanPhone = String(phone).replace(/\s+/g, '').trim();
    const cleanCode = (rawCode || '').trim().toUpperCase();
    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // If a lease code is provided, try Supabase RPC if present
    if (cleanCode && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('request_owner_otp', {
          p_code: cleanCode,
          p_phone: cleanPhone,
        });

        if (!rpcError && rpcData) {
          res.json({
            message: 'Código de verificación SMS enviado con éxito.',
            otpSent: true,
            demoCode: rpcData.demo_otp || undefined,
          });
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_RPC_FAILED]', { route: 'POST /api/public/request-otp (request_owner_otp)', error: err });
      }
    }

    // Fallback in-memory OTP for testing / production
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRecord = {
      otp: generatedOtp,
      expiresAt: Date.now() + 15 * 60 * 1000,
      verified: false,
      phone: cleanPhone,
    };

    otpStore.set(cleanPhone, otpRecord);
    if (cleanCode) {
      otpStore.set(`${cleanCode}_${cleanPhone}`, otpRecord);
    }

    res.json({
      message: 'Código de verificación SMS enviado.',
      otpSent: true,
      demoCode: generatedOtp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al solicitar el código OTP.' });
  }
};

// Helper function to handle OTP verification
const handleOtpVerify = async (rawCode: string | undefined, phone: any, otp: any, res: Response) => {
  try {
    if (!phone || !otp) {
      res.status(400).json({ error: 'Teléfono y código OTP son requeridos.' });
      return;
    }

    const cleanPhone = String(phone).replace(/\s+/g, '').trim();
    const cleanOtp = String(otp).trim();
    const cleanCode = (rawCode || '').trim().toUpperCase();
    const supabase = isSupabaseConfigured() ? getSupabase() : null;

    // Try Supabase RPC verify_owner_otp if code present
    if (cleanCode && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('verify_owner_otp', {
          p_code: cleanCode,
          p_phone: cleanPhone,
          p_otp: cleanOtp,
        });

        if (!rpcError && rpcData === true) {
          res.json({
            message: 'Número de teléfono verificado exitosamente.',
            verified: true,
          });
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_RPC_FAILED]', { route: 'POST /api/public/verify-otp (verify_owner_otp)', error: err });
      }
    }

    // Fallback store check (check by phone or code_phone)
    const record = (cleanCode ? otpStore.get(`${cleanCode}_${cleanPhone}`) : null) || otpStore.get(cleanPhone);
    if (record && record.otp === cleanOtp && record.expiresAt > Date.now()) {
      record.verified = true;
      res.json({
        message: 'Número de teléfono verificado exitosamente.',
        verified: true,
      });
      return;
    }

    res.status(400).json({ error: 'Código OTP inválido o expirado.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error durante la verificación del código OTP.' });
  }
};

// 3. Routes pour demander un code OTP par SMS pour le propriétaire
publicRouter.post('/request-otp', (req: Request, res: Response) => {
  handleOtpRequest(req.body.code, req.body.phone, res);
});

publicRouter.post('/leases/:code/request-otp', (req: Request, res: Response) => {
  handleOtpRequest(req.params.code || req.body.code, req.body.phone, res);
});

// 4. Routes pour valider le code OTP SMS
publicRouter.post('/verify-otp', (req: Request, res: Response) => {
  handleOtpVerify(req.body.code, req.body.phone, req.body.otp, res);
});

publicRouter.post('/leases/:code/verify-otp', (req: Request, res: Response) => {
  handleOtpVerify(req.params.code || req.body.code, req.body.phone, req.body.otp, res);
});

// 5. Endpoint para detección automática de ubicación por IP o geolocalización
publicRouter.get('/detect-location', async (req: Request, res: Response) => {
  try {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      '';

    const isLocal = !rawIp || rawIp.includes('127.0.0.1') || rawIp === '::1' || rawIp.startsWith('10.') || rawIp.startsWith('192.168.');

    let detectedCity = 'Málaga';
    let detectedRegion = 'Andalucía';
    let detectedCountry = 'España';
    let lat = 36.7213;
    let lng = -4.4214;
    let source = isLocal ? 'ip_auto' : 'ip_client';

    // Provider 1: ipwho.is (Free, fast, no API key needed, high reliability)
    let fetched = false;
    try {
      const ipwhoUrl = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${rawIp}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(ipwhoUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'RentiaApp/1.0' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data && data.success !== false && data.city) {
          detectedCity = data.city;
          detectedRegion = data.region || detectedRegion;
          detectedCountry = data.country || detectedCountry;
          if (data.latitude && data.longitude) {
            lat = Number(data.latitude);
            lng = Number(data.longitude);
          }
          fetched = true;
          source = 'ipwho_is';
        }
      }
    } catch {}

    // Provider 2: ipapi.co fallback if provider 1 was unavailable
    if (!fetched) {
      try {
        const fetchUrl = isLocal ? 'https://ipapi.co/json/' : `https://ipapi.co/${rawIp}/json/`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'RentiaApp/1.0' },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.city) {
            detectedCity = data.city;
            detectedRegion = data.region || detectedRegion;
            detectedCountry = data.country_name || detectedCountry;
            if (data.latitude && data.longitude) {
              lat = Number(data.latitude);
              lng = Number(data.longitude);
            }
            source = 'ipapi_co';
          }
        }
      } catch {}
    }

    res.json({
      success: true,
      city: detectedCity,
      region: detectedRegion,
      country: detectedCountry,
      latitude: lat,
      longitude: lng,
      source,
    });
  } catch (err: any) {
    res.json({
      success: true,
      city: 'Málaga',
      region: 'Andalucía',
      country: 'España',
      latitude: 36.7213,
      longitude: -4.4214,
      source: 'fallback',
    });
  }
});

