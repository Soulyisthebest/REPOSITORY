import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getSupabase, getSupabaseAdmin, getSupabaseUrl, isSupabaseConfigured } from '../supabase';
import { requireAdminAuth, optionalTenantAuth, AuthenticatedRequest } from '../middleware/auth';
import { RentiaDB, logSupabaseWriteFailure } from '../db/database';
import { getAllLocalUsers } from '../localAuthStore';

export const adminRouter = Router();

// Todas las rutas de administración de datos, moderación y métricas requieren sesión Admin estricta (Prioridad 8.1 / 6.1)
adminRouter.use(requireAdminAuth);

/**
 * GET /api/admin/supabase/status
 * Diagnóstico exhaustivo y comprobación de tablas en Supabase PostgreSQL.
 */
adminRouter.get('/supabase/status', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configured = isSupabaseConfigured();
    const url = getSupabaseUrl();
    const admin = getSupabaseAdmin();
    
    // Check tables to see what exists in Supabase schema cache
    const tableNames = [
      'profiles',
      'user_logins',
      'user_sessions',
      'user_activity_logs',
      'rental_leases',
      'leases',
      'marketplace_listings',
      'listings',
      'property_ownership_verifications',
      'match_connections',
      'matches',
    ];

    const results = await Promise.all(
      tableNames.map(async (name) => {
        try {
          const { data, error } = await admin
            .from(name)
            .select('*')
            .limit(1);
          
          if (error) {
            return {
              name,
              exists: false,
              count: 0,
              status: error.code === 'PGRST205' ? 'missing' : 'error',
              error: error.message,
              code: error.code,
            };
          }

          return {
            name,
            exists: true,
            count: data ? data.length : 0,
            status: 'ready',
            error: null,
            code: null,
          };
        } catch (err: any) {
          return {
            name,
            exists: false,
            count: 0,
            status: 'unreachable',
            error: err.message,
            code: 'FETCH_FAIL',
          };
        }
      })
    );

    let sqlSchema = '';
    const sqlPath = path.join(process.cwd(), 'supabase_setup_complete.sql');
    if (fs.existsSync(sqlPath)) {
      sqlSchema = fs.readFileSync(sqlPath, 'utf-8');
    }

    let projectId = 'tu-proyecto';
    try {
      if (url) {
        projectId = new URL(url).hostname.split('.')[0] || 'tu-proyecto';
      }
    } catch (err: any) {
      console.warn('[ADMIN_PROJECT_ID_PARSE_FAILED]', { url, error: err?.message || err });
      projectId = url.replace('https://', '').split('.')[0] || 'tu-proyecto';
    }
    const totalReady = results.filter((r) => r.status === 'ready').length;

    res.json({
      configured,
      url,
      projectId,
      sqlEditorUrl: `https://supabase.com/dashboard/project/${projectId}/sql/new`,
      totalTablesChecked: tableNames.length,
      totalReady,
      tables: results,
      sqlSchema,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error diagnosticando Supabase.' });
  }
});

/**
 * GET /api/admin/stats
 * Resumen global para el panel de administración con conteos de base de datos
 */
adminRouter.get('/stats', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Estadísticas exactas calculadas de la base de datos persistente real
    const dbStats = RentiaDB.getExactDatabaseStats();

    // 2. Si Supabase está disponible, sincronizamos/enriquecemos conteos en segundo plano
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase(req.supabaseToken);
        const [
          { count: sbUsers },
          { count: sbListings },
          { count: sbMatches },
          { count: sbPendingOwnerships },
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('listings').select('id', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('matches').select('id', { count: 'exact', head: true }),
          supabase.from('property_ownership_verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        res.json({
          totalUsers: Math.max(dbStats.totalUsers, sbUsers || 0),
          totalListings: Math.max(dbStats.totalListings, sbListings || 0),
          totalTenants: dbStats.totalTenants,
          totalMatches: Math.max(dbStats.totalMatches, sbMatches || 0),
          totalLeases: dbStats.totalLeases,
          pendingOwnerships: sbPendingOwnerships !== null ? sbPendingOwnerships : dbStats.pendingOwnerships,
          pendingLeases: dbStats.pendingLeases,
          totalLogins: dbStats.totalLogins,
          totalSessions: dbStats.totalSessions,
          activeSessionsNow: dbStats.activeSessionsNow,
          totalTimeSpentMinutes: dbStats.totalTimeSpentMinutes,
        });
        return;
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/admin/stats', error: err });
      }
    }

    res.json(dbStats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener estadísticas de administración.' });
  }
});

/**
 * GET /api/admin/detailed-real-analytics
 * Métricas 100% reales calculadas directamente de la base de datos sin datos inventados
 */
adminRouter.get('/detailed-real-analytics', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = RentiaDB.getRealAdminAnalytics();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener analítica real.' });
  }
});

/**
 * GET /api/admin/sessions/summary
 * Métricas analíticas globales de logins y permanencia en la app
 */
adminRouter.get('/sessions/summary', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { RentiaDB } = await import('../db/database');
    const summary = RentiaDB.getGlobalAnalytics();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener resumen de sesiones.' });
  }
});

/**
 * GET /api/admin/ownership-verifications
 * Lista de solicitudes de verificación de titularidad de la propiedad
 */
adminRouter.get('/ownership-verifications', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statusFilter = req.query.status ? String(req.query.status) : 'pending';

    // 1. Obtener de la base de datos persistente real
    const localVerifs = RentiaDB.getOwnershipVerifications(statusFilter);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase(req.supabaseToken);
        const { data: verifs, error } = await supabase
          .from('property_ownership_verifications')
          .select(`
            *,
            listing:listings(id, title, city, rent, photos),
            landlord:profiles(id, name, email, phone)
          `)
          .eq('status', statusFilter)
          .order('created_at', { ascending: false });

        if (!error && verifs && verifs.length > 0) {
          res.json(verifs);
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/admin/ownership-verifications', error: err });
      }
    }

    res.json(localVerifs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al cargar verificaciones de titularidad.' });
  }
});

/**
 * POST /api/admin/ownership-verifications/:id/review
 * Revisar y validar o rechazar titularidad de la propiedad
 */
adminRouter.post('/ownership-verifications/:id/review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason } = req.body; // 'verified' | 'rejected'
    const adminId = req.tenant!.id;

    if (!decision || (decision !== 'verified' && decision !== 'rejected')) {
      res.status(400).json({ error: 'La decisión debe ser "verified" o "rejected".' });
      return;
    }

    // Actualizar en base de datos real
    const updated = RentiaDB.reviewOwnershipVerification(id, decision, adminId, rejectionReason);

    // Actualizar en Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase(req.supabaseToken);
        await supabase
          .from('property_ownership_verifications')
          .update({
            status: decision,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
            rejection_reason: decision === 'rejected' ? (rejectionReason || null) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updated?.listing_id) {
          await supabase
            .from('listings')
            .update({
              verification_status: decision,
              verification_reviewed_at: new Date().toISOString(),
            })
            .eq('id', updated.listing_id);
        }
      } catch (err: any) {
        logSupabaseWriteFailure({
          route: 'POST /api/admin/ownership-verifications/:id/review',
          operation: 'update',
          target_table: 'property_ownership_verifications',
          payload: { id, decision, adminId, rejectionReason, listing_id: updated?.listing_id },
          error: err,
        });
      }
    }

    res.json({ success: true, decision, verificationId: id, verification: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al procesar la revisión de titularidad.' });
  }
});

/**
 * GET /api/admin/listings
 * Inmuebles reales registrados en la base de datos
 */
adminRouter.get('/listings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const city = req.query.city ? String(req.query.city) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const listings = RentiaDB.getListings({ city, search });
    res.json(listings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al listar inmuebles de la base de datos.' });
  }
});

/**
 * POST /api/admin/listings
 * Registrar un nuevo inmueble real en la base de datos
 */
adminRouter.post('/listings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, address, city, rent } = req.body;
    if (!title || !address || !city || !rent) {
      res.status(400).json({ error: 'Título, dirección, ciudad y precio de alquiler son obligatorios.' });
      return;
    }

    const created = RentiaDB.saveListing({
      ...req.body,
      landlord_id: req.body.landlord_id || req.tenant!.id,
      landlord_name: req.body.landlord_name || req.tenant!.name,
      landlord_email: req.body.landlord_email || req.tenant!.email,
    });

    res.json({ success: true, listing: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al registrar inmueble en la base de datos.' });
  }
});

/**
 * POST /api/admin/listings/:id/toggle
 * Activar o pausar un inmueble real
 */
adminRouter.post('/listings/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = RentiaDB.toggleListingActive(id, isActive);
    if (!updated) {
      res.status(404).json({ error: 'Inmueble no encontrado.' });
      return;
    }
    res.json({ success: true, listing: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al alternar estado del inmueble.' });
  }
});

/**
 * PUT /api/admin/listings/:id
 * Modificar un inmueble de la base de datos (título, precio, dirección, estado)
 */
adminRouter.put('/listings/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = RentiaDB.updateListing(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Inmueble no encontrado para editar.' });
      return;
    }
    res.json({ success: true, listing: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al modificar inmueble.' });
  }
});

/**
 * DELETE /api/admin/listings/:id
 * Eliminar un inmueble de la base de datos
 */
adminRouter.delete('/listings/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = RentiaDB.deleteListing(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al eliminar inmueble.' });
  }
});

/**
 * GET /api/admin/tenants
 * Perfiles de inquilinos reales registrados en la base de datos
 */
adminRouter.get('/tenants', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const city = req.query.city ? String(req.query.city) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const tenants = RentiaDB.getTenantProfiles({ city, search });
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener inquilinos de la base de datos.' });
  }
});

/**
 * GET /api/admin/matches
 * Matches reales registrados en la base de datos
 */
adminRouter.get('/matches', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matches = RentiaDB.getMatches();
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener matches de la base de datos.' });
  }
});

/**
 * GET /api/admin/users
 * Gestión y moderación de usuarios (inquilinos, propietarios)
 */
adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roleFilter = req.query.role ? String(req.query.role) : undefined;
    const localUsers = RentiaDB.getUsers({ role: roleFilter });

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase(req.supabaseToken);
        let query = supabase
          .from('profiles')
          .select('id, name, email, phone, role, trust_score, is_active, is_verified, created_at')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (roleFilter) {
          query = query.eq('role', roleFilter);
        }

        const { data: sbUsers } = await query;
        if (sbUsers && sbUsers.length > 0) {
          // Merge avoiding duplicates by email
          const map = new Map<string, any>();
          localUsers.forEach(u => map.set(u.email.toLowerCase(), u));
          sbUsers.forEach(u => map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }));
          res.json(Array.from(map.values()));
          return;
        }
      } catch (err: any) {
        console.error('[SUPABASE_READ_FAILED]', { route: 'GET /api/admin/users', error: err });
      }
    }

    res.json(localUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al listar usuarios.' });
  }
});

/**
 * POST /api/admin/users/:id/toggle-status
 * Suspender o reactivar usuario
 */
adminRouter.post('/users/:id/toggle-status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.tenant!.id;

    RentiaDB.toggleUserStatus(id, Boolean(isActive));

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase(req.supabaseToken);
        await supabase
          .from('profiles')
          .update({ is_active: Boolean(isActive) })
          .eq('id', id);

        await supabase.from('admin_audit_log').insert({
          admin_id: adminId,
          action: isActive ? 'user_activated' : 'user_suspended',
          target_type: 'user',
          target_id: id,
        });
      } catch (err: any) {
        logSupabaseWriteFailure({
          route: 'POST /api/admin/users/:id/toggle-status',
          operation: 'update',
          target_table: 'profiles',
          payload: { id, is_active: Boolean(isActive), adminId },
          error: err,
        });
      }
    }

    res.json({ success: true, userId: id, is_active: Boolean(isActive) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al cambiar estado del usuario.' });
  }
});

/**
 * GET /api/admin/users/:id/profile
 * Consulta completa y detallada del perfil de un usuario (inquilino o propietario)
 */
adminRouter.get('/users/:id/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const profileData = RentiaDB.getUserDetailedProfile(id);
    if (!profileData) {
      res.status(404).json({ error: 'Perfil de usuario no encontrado.' });
      return;
    }
    res.json(profileData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al consultar perfil detallado del usuario.' });
  }
});

/**
 * GET /api/admin/blocked-emails
 * Listado de correos bloqueados en la plataforma
 */
adminRouter.get('/blocked-emails', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = RentiaDB.getBlockedEmails();
    res.json(Array.isArray(list) ? list : []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener lista de correos bloqueados.' });
  }
});

/**
 * POST /api/admin/blocked-emails
 * Bloquear una dirección de correo electrónico
 */
adminRouter.post('/blocked-emails', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, reason } = req.body;
    if (!email) {
      res.status(400).json({ error: 'El correo electrónico es obligatorio.' });
      return;
    }
    const adminEmail = req.tenant?.email || 'admin@rentia.com';
    const record = RentiaDB.addBlockedEmail(email, reason, adminEmail);
    res.json({ success: true, blocked: record });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al bloquear correo electrónico.' });
  }
});

/**
 * DELETE /api/admin/blocked-emails/:email
 * Desbloquear una dirección de correo electrónico
 */
adminRouter.delete('/blocked-emails/:email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const success = RentiaDB.removeBlockedEmail(email);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al desbloquear correo electrónico.' });
  }
});

/**
 * GET /api/admin/logins
 * Registro detallado de todos los inicios de sesión (éxitos, fallos, IPs, dispositivos)
 */
adminRouter.get('/logins', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, status, limit } = req.query;
    const { RentiaDB } = await import('../db/database');
    const logins = RentiaDB.getLogins({
      email: email ? String(email) : undefined,
      status: status ? String(status) : undefined,
      limit: limit ? Number(limit) : 100,
    });
    res.json(Array.isArray(logins) ? logins : []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener registro de inicios de sesión.' });
  }
});

/**
 * GET /api/admin/sessions
 * Registro de sesiones y tiempo que pasa cada usuario en la aplicación
 */
adminRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, activeOnly, limit } = req.query;
    const { RentiaDB } = await import('../db/database');
    const sessions = RentiaDB.getSessions({
      email: email ? String(email) : undefined,
      activeOnly: activeOnly === 'true',
      limit: limit ? Number(limit) : 100,
    });
    res.json(Array.isArray(sessions) ? sessions : []);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener registro de sesiones.' });
  }
});

/**
 * POST /api/admin/supabase/test-insert
 * Prueba interactiva de inserción en Supabase (ej: login de prueba)
 */
adminRouter.post('/supabase/test-insert', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = getSupabaseAdmin();
    const testId = `test_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const insertRes = await admin.from('user_logins').insert({
      email: req.tenant?.email || 'admin@rentia.es',
      role: 'admin',
      status: 'success',
      ip_address: req.ip || '127.0.0.1',
      user_agent: 'Rentia Diagnostic Tool',
      device_type: 'Escritorio',
      browser: 'Admin Console',
      os: 'Cloud System',
      login_method: 'supabase_diagnostic_test',
      session_id: testId,
      created_at: timestamp,
    }).select();

    if (insertRes.error) {
      res.json({
        success: false,
        error: insertRes.error.message,
        code: insertRes.error.code,
        hint: insertRes.error.code === 'PGRST205' 
          ? 'La tabla user_logins no existe todavía en Supabase. Pega y ejecuta el script SQL en el SQL Editor de Supabase.'
          : insertRes.error.hint,
      });
      return;
    }

    res.json({
      success: true,
      message: '¡Registro de prueba insertado exitosamente en Supabase PostgreSQL!',
      insertedRecord: insertRes.data?.[0],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/admin/supabase/sync-all
 * Prueba de sincronización completa y subida de datos locales a Supabase Cloud
 */
adminRouter.post('/supabase/sync-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const admin = getSupabaseAdmin();
    const syncSummary: Record<string, { attempted: number; success: number; status: 'ok' | 'table_missing' | 'error'; error?: string }> = {};

    // 1. Sincronizar perfiles
    const users = getAllLocalUsers();
    try {
      const profilesToSync = users.map((u) => ({
        id: u.id && u.id.length >= 8 ? u.id : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        verification_status: u.is_verified ? 'verified' : 'unverified',
        trust_score: u.trust_score || 85,
        created_at: u.created_at,
      }));

      const { error: profErr } = await admin.from('profiles').upsert(profilesToSync, { onConflict: 'email' });
      if (profErr) {
        syncSummary.profiles = {
          attempted: profilesToSync.length,
          success: 0,
          status: profErr.code === 'PGRST205' ? 'table_missing' : 'error',
          error: profErr.message,
        };
      } else {
        syncSummary.profiles = {
          attempted: profilesToSync.length,
          success: profilesToSync.length,
          status: 'ok',
        };
      }
    } catch (e: any) {
      syncSummary.profiles = { attempted: users.length, success: 0, status: 'error', error: e.message };
    }

    // 2. Sincronizar inicios de sesión (user_logins)
    const logins = RentiaDB.getLogins({ limit: 100 });
    try {
      const loginsToSync = logins.slice(0, 50).map((l) => ({
        email: l.email,
        role: l.role,
        status: l.status,
        ip_address: l.ip_address,
        user_agent: l.user_agent,
        device_type: l.device_type,
        browser: l.browser,
        os: l.os,
        login_method: l.login_method,
        session_id: l.session_id,
        created_at: l.created_at,
      }));

      if (loginsToSync.length > 0) {
        const { error: logErr } = await admin.from('user_logins').insert(loginsToSync);
        if (logErr) {
          syncSummary.user_logins = {
            attempted: loginsToSync.length,
            success: 0,
            status: logErr.code === 'PGRST205' ? 'table_missing' : 'error',
            error: logErr.message,
          };
        } else {
          syncSummary.user_logins = {
            attempted: loginsToSync.length,
            success: loginsToSync.length,
            status: 'ok',
          };
        }
      } else {
        syncSummary.user_logins = { attempted: 0, success: 0, status: 'ok' };
      }
    } catch (e: any) {
      syncSummary.user_logins = { attempted: logins.length, success: 0, status: 'error', error: e.message };
    }

    // 3. Sincronizar sesiones (user_sessions)
    const sessions = RentiaDB.getSessions({ limit: 100 });
    try {
      const sessionsToSync = sessions.slice(0, 50).map((s) => ({
        session_id: s.id,
        user_email: s.email,
        started_at: s.started_at,
        last_heartbeat: s.last_heartbeat_at,
        ended_at: s.ended_at || null,
        duration_seconds: s.duration_seconds,
        active_seconds: s.active_duration_seconds,
        idle_seconds: s.idle_duration_seconds,
        total_seconds: s.duration_seconds,
        device_type: s.device_type,
        browser: s.browser,
        os: s.os,
        ip_address: s.ip_address,
        is_active: s.is_active,
        created_at: s.started_at,
      }));

      if (sessionsToSync.length > 0) {
        const { error: sessErr } = await admin.from('user_sessions').upsert(sessionsToSync, { onConflict: 'session_id' });
        if (sessErr) {
          syncSummary.user_sessions = {
            attempted: sessionsToSync.length,
            success: 0,
            status: sessErr.code === 'PGRST205' ? 'table_missing' : 'error',
            error: sessErr.message,
          };
        } else {
          syncSummary.user_sessions = {
            attempted: sessionsToSync.length,
            success: sessionsToSync.length,
            status: 'ok',
          };
        }
      } else {
        syncSummary.user_sessions = { attempted: 0, success: 0, status: 'ok' };
      }
    } catch (e: any) {
      syncSummary.user_sessions = { attempted: sessions.length, success: 0, status: 'error', error: e.message };
    }

    const hasMissing = Object.values(syncSummary).some((r) => r.status === 'table_missing');
    const allOk = Object.values(syncSummary).every((r) => r.status === 'ok');

    res.json({
      success: allOk,
      hasMissingTables: hasMissing,
      summary: syncSummary,
      message: allOk
        ? '¡Datos sincronizados exitosamente con Supabase PostgreSQL!'
        : hasMissing
        ? 'Algunas tablas no existen en Supabase aún. Copia el script SQL y ejecútalo en el SQL Editor de tu proyecto.'
        : 'Sincronización completada con algunas advertencias.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});


