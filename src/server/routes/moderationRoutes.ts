import { Router, Request, Response } from 'express';
import { RentiaDB } from '../db/database';
import { optionalTenantAuth, AuthenticatedRequest } from '../middleware/auth';

export const moderationRouter = Router();

// ==========================================
// 1. REPORTES Y DENUNCIAS DE USUARIOS / ANUNCIOS
// ==========================================

/**
 * POST /api/reports
 * Enviar denuncia de un anuncio, perfil de inquilino o usuario sospechoso (estafa, falsificación, etc.)
 */
moderationRouter.post('/reports', optionalTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      target_type,
      target_id,
      target_title,
      target_user_id,
      target_user_email,
      target_user_name,
      reason,
      reason_label,
      details,
      evidence_url,
    } = req.body;

    if (!target_type || !target_id || !reason) {
      res.status(400).json({ error: 'Faltan campos obligatorios para enviar la denuncia (tipo, id o motivo).' });
      return;
    }

    const reporter_id = req.tenant?.id || req.body.reporter_id || 'anonymous_reporter';
    const reporter_name = req.tenant?.name || req.body.reporter_name || 'Usuario de Rentia';
    const reporter_email = req.tenant?.email || req.body.reporter_email;
    const reporter_role = req.tenant?.role || req.body.reporter_role || 'user';

    const report = RentiaDB.createReport({
      reporter_id,
      reporter_name,
      reporter_email,
      reporter_role,
      target_type,
      target_id,
      target_title,
      target_user_id,
      target_user_email,
      target_user_name,
      reason,
      reason_label,
      details: details || 'Denuncia registrada por el usuario sin descripción adicional.',
      evidence_url,
    });

    res.status(201).json({
      success: true,
      message: 'Denuncia registrada con éxito. Nuestro equipo de moderación la revisará a la mayor brevedad.',
      report,
    });
  } catch (err: any) {
    console.error('Error al registrar denuncia:', err);
    res.status(500).json({ error: err.message || 'Error al procesar la denuncia.' });
  }
});

/**
 * GET /api/reports
 * Obtener listado de denuncias para el panel de administración
 */
moderationRouter.get('/reports', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const reports = RentiaDB.getReports(status);
    res.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al obtener denuncias.' });
  }
});

/**
 * PATCH /api/reports/:id/action
 * Acción tomada por el administrador (bloquear cuenta, bloquear anuncio, o desestimar)
 */
moderationRouter.patch('/reports/:id/action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, action_notes, reviewed_by } = req.body;

    if (!action || !['user_blocked', 'listing_removed', 'dismissed', 'none'].includes(action)) {
      res.status(400).json({ error: 'Acción no válida. Opciones: user_blocked, listing_removed, dismissed' });
      return;
    }

    const updated = RentiaDB.updateReportStatus(id, action, action_notes, reviewed_by || 'admin');

    if (!updated) {
      res.status(404).json({ error: 'Denuncia no encontrada.' });
      return;
    }

    res.json({
      success: true,
      message: action === 'user_blocked' 
        ? 'Cuenta de usuario bloqueada e inhabilitada con éxito.' 
        : action === 'listing_removed'
        ? 'Anuncio retirado y bloqueado con éxito.'
        : 'Denuncia resuelta y archivada.',
      report: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al actualizar denuncia.' });
  }
});

// ==========================================
// 2. VERIFICACIÓN DE IDENTIDAD KYC (DNI + SELFIE)
// ==========================================

/**
 * POST /api/kyc/submit
 * Subir selfie con DNI o DNI frontal para verificación de identidad
 */
moderationRouter.post('/kyc/submit', optionalTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      user_id,
      user_name,
      user_email,
      user_role,
      id_document_number,
      id_document_type,
      dni_front_url,
      dni_back_url,
      selfie_url,
      selfie_with_id_url,
    } = req.body;

    const actualUserId = req.tenant?.id || user_id;
    const actualName = req.tenant?.name || user_name;
    const actualEmail = req.tenant?.email || user_email;
    const actualRole = req.tenant?.role || user_role || 'tenant';

    if (!actualUserId || !actualEmail || !dni_front_url || !selfie_url) {
      res.status(400).json({
        error: 'Para verificar la cuenta debes subir tanto la foto de tu DNI como una fotografía tuya (selfie).',
      });
      return;
    }

    // Regla estricta: La verificación con DNI se hace una única vez
    const existingKyc = RentiaDB.getKycVerifications().find(
      (k) => (actualUserId && k.user_id === actualUserId) || (actualEmail && k.user_email === actualEmail)
    );
    const existingUser = RentiaDB.getUserById(actualUserId) || RentiaDB.getUserByEmail(actualEmail);
    if (existingUser?.is_verified || existingKyc?.status === 'verified') {
      res.status(200).json({
        success: true,
        alreadyVerified: true,
        message: 'Tu identidad ya ha sido verificada con DNI. La verificación de identidad se realiza una única vez.',
        kyc: existingKyc || null,
      });
      return;
    }

    const kyc = RentiaDB.submitKycVerification({
      user_id: actualUserId,
      user_name: actualName || 'Usuario Rentia',
      user_email: actualEmail,
      user_role: actualRole,
      id_document_number,
      id_document_type: id_document_type || 'DNI',
      dni_front_url,
      dni_back_url,
      selfie_url,
      selfie_with_id_url,
    });

    res.status(201).json({
      success: true,
      message: 'Documentos de identidad y selfie enviados correctamente. Tu cuenta pasará a revisión por el equipo de administración.',
      kyc,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al enviar verificación de identidad.' });
  }
});

/**
 * GET /api/kyc/status
 * Obtener estado de verificación del usuario actual
 */
moderationRouter.get('/kyc/status', optionalTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.tenant?.id || (req.query.userId as string);
    const email = req.tenant?.email || (req.query.email as string);

    if (!userId && !email) {
      res.status(400).json({ error: 'Parámetros de usuario requeridos.' });
      return;
    }

    const all = RentiaDB.getKycVerifications();
    const userKyc = all.find((k) => (userId && k.user_id === userId) || (email && k.user_email === email));

    res.json({
      success: true,
      status: userKyc?.status || 'unverified',
      kyc: userKyc || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al consultar estado KYC.' });
  }
});

/**
 * GET /api/kyc/admin/list
 * Listar todas las solicitudes KYC para revisión del admin
 */
moderationRouter.get('/kyc/admin/list', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const list = RentiaDB.getKycVerifications(status);
    res.json({ success: true, count: list.length, list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al listar verificaciones.' });
  }
});

/**
 * PATCH /api/kyc/admin/:id/review
 * Aprobar y asignar el check verde o rechazar verificación
 */
moderationRouter.patch('/kyc/admin/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason, reviewed_by } = req.body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Estado no válido. Opciones: verified, rejected.' });
      return;
    }

    const result = RentiaDB.reviewKycVerification(
      id,
      status,
      rejection_reason,
      reviewed_by || 'admin'
    );

    if (!result) {
      res.status(404).json({ error: 'Verificación KYC no encontrada.' });
      return;
    }

    res.json({
      success: true,
      message: status === 'verified'
        ? 'Cuenta verificada exitosamente. Check verde asignado y permisos completos concedidos.'
        : 'Verificación rechazada.',
      kyc: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al revisar verificación KYC.' });
  }
});

// ==========================================
// 3. PERFIL FINANCIERO Y PERSONAL DEL INQUILINO
// ==========================================

/**
 * PUT /api/tenant/profile/financial
 * Actualizar nómina mensual, avalista, ingresos del avalista, profesión y mascotas
 */
moderationRouter.put('/tenant/profile/financial', optionalTenantAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userIdOrEmail = req.tenant?.id || req.tenant?.email || req.body.userId || req.body.email;
    if (!userIdOrEmail) {
      res.status(400).json({ error: 'Identificador de usuario requerido.' });
      return;
    }

    const payload = req.body;
    if (payload.photos && Array.isArray(payload.photos) && payload.photos.length > 0 && payload.photos.length < 3) {
      res.status(400).json({ error: `Es obligatorio subir un mínimo de 3 fotografías del inquilino (has aportado ${payload.photos.length}).` });
      return;
    }

    const updated = RentiaDB.updateTenantFinancialProfile(userIdOrEmail, {
      ...payload,
      monthly_income: payload.monthly_income !== undefined ? Number(payload.monthly_income) : undefined,
      max_budget: payload.max_budget !== undefined ? Number(payload.max_budget) : undefined,
      min_budget: payload.min_budget !== undefined ? Number(payload.min_budget) : undefined,
      stretch_budget: payload.stretch_budget !== undefined ? Number(payload.stretch_budget) : undefined,
      guarantor_income: payload.guarantor_income !== undefined ? Number(payload.guarantor_income) : undefined,
      has_guarantor: payload.has_guarantor !== undefined ? Boolean(payload.has_guarantor) : undefined,
      has_pets: payload.has_pets !== undefined ? Boolean(payload.has_pets) : undefined,
      has_minors: payload.has_minors !== undefined ? Boolean(payload.has_minors) : undefined,
    });

    res.json({
      success: true,
      message: 'Perfil financiero y personal actualizado con éxito.',
      profile: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error al actualizar perfil.' });
  }
});
