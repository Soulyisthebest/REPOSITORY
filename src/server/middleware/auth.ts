import { Request, Response, NextFunction } from 'express';
import { getSupabase, getSupabaseAdmin, isSupabaseConfigured } from '../supabase';
import { verifyLocalToken, findLocalUserByEmail } from '../localAuthStore';

export const ADMIN_EMAILS = [
  'soullis10@gmail.com',
  'soullis8@gmail.com',
  'admin@rentia.es',
  'admin@rentia.com',
];

export interface AuthenticatedTenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'tenant' | 'landlord' | 'agency' | 'admin';
  is_active?: boolean;
  is_verified?: boolean;
  preferred_lang: string;
  avatar_url?: string;
}

export interface AuthenticatedRequest extends Request {
  tenant?: AuthenticatedTenant;
  supabaseToken?: string;
}

export async function requireTenantAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.rentia_token) {
      token = req.cookies.rentia_token;
    }

    const acceptLang = (req.headers['accept-language'] as string) || '';
    const getErrMsg = (es: string, en: string, fr: string) => {
      if (acceptLang.includes('fr')) return fr;
      if (acceptLang.includes('en')) return en;
      return es;
    };

    if (!token) {
      res.status(401).json({
        error: getErrMsg(
          'Se requiere iniciar sesión para acceder a este recurso.',
          'Authentication required to access this resource.',
          'Connexion requise pour accéder à cette ressource.'
        ),
      });
      return;
    }

    // 1. Check local/demo token first
    const localUser = verifyLocalToken(token);
    if (localUser) {
      if (localUser.is_active === false) {
        res.status(403).json({
          error: getErrMsg(
            'Tu cuenta ha sido suspendida. Por favor, contacta con soporte.',
            'Your account has been suspended. Please contact support.',
            'Votre compte a été suspendu. Veuillez contacter le support.'
          ),
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }
      req.tenant = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone,
        role: localUser.role,
        is_active: localUser.is_active,
        is_verified: localUser.is_verified,
        preferred_lang: localUser.preferred_lang,
        avatar_url: localUser.avatar_url || '',
      };
      req.supabaseToken = token;
      next();
      return;
    }

    // 2. Native Supabase Auth Token verification (when Supabase is configured)
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      res.status(401).json({
        error: getErrMsg(
          'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.',
          'Invalid or expired session. Please log in again.',
          'Session invalide ou expirée.'
        ),
      });
      return;
    }

    const user = userData.user;
    const userId = user.id;
    const userEmail = user.email || '';
    const rawName = user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split('@')[0] || 'Usuario Rentia';

    // Check or upsert profile in Supabase profiles table
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role, is_active, is_verified, preferred_lang, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const rawRole = user.user_metadata?.role;
      const userRole = rawRole === 'agency' ? 'agency' : rawRole === 'landlord' ? 'landlord' : 'tenant';
      const newProfile = {
        id: userId,
        name: rawName,
        email: userEmail,
        phone: user.user_metadata?.phone || null,
        role: userRole,
        trust_score: 50,
        preferred_lang: user.user_metadata?.preferred_lang || 'es',
        avatar_url: user.user_metadata?.avatar_url || '',
      };

      await supabase.from('profiles').insert(newProfile);
      profile = newProfile as any;

      // Add initial reputation event for new user profile using exact schema columns
      try {
        await supabase.from('reputation_events').insert({
          user_id: userId,
          event_type: 'lease_created',
          score_delta: 0,
          resulting_score: 50,
          details: { description: 'Creación de perfil — Puntuación neutral inicial (50/100)' },
        });
      } catch (repErr) {
        console.warn('Initial reputation event warning in auth:', repErr);
      }
    }

    // P0 / 1-BIS.1: Bloqueo de cuenta estricto. Si is_active es false, cortar la petición inmediatamente.
    if ((profile as any)?.is_active === false) {
      const lang = profile?.preferred_lang || 'es';
      res.status(403).json({
        error: lang === 'en'
          ? 'Your account has been suspended. Please contact support.'
          : lang === 'fr'
          ? 'Votre compte a été suspendu. Veuillez contacter le support.'
          : 'Tu cuenta ha sido suspendida. Por favor, contacta con soporte.',
        code: 'ACCOUNT_SUSPENDED',
      });
      return;
    }

    req.tenant = {
      id: userId,
      name: profile?.name || rawName,
      email: profile?.email || userEmail,
      phone: profile?.phone || undefined,
      role: (profile as any)?.role || user.user_metadata?.role || 'tenant',
      is_active: true,
      is_verified: Boolean((profile as any)?.is_verified),
      preferred_lang: profile?.preferred_lang || 'es',
      avatar_url: profile?.avatar_url || '',
    };
    req.supabaseToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

export async function optionalTenantAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.rentia_token) {
      token = req.cookies.rentia_token;
    }

    if (!token) {
      next();
      return;
    }

    // 1. Check local/demo token first
    const localUser = verifyLocalToken(token);
    if (localUser) {
      req.tenant = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone,
        role: localUser.role,
        is_active: localUser.is_active,
        is_verified: localUser.is_verified,
        preferred_lang: localUser.preferred_lang,
        avatar_url: localUser.avatar_url || '',
      };
      req.supabaseToken = token;
      next();
      return;
    }

    // 2. Native Supabase Auth verification
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (!userError && userData?.user) {
      const user = userData.user;
      const userId = user.id;
      const userEmail = user.email || '';
      const rawName = user.user_metadata?.name || user.user_metadata?.full_name || userEmail.split('@')[0] || 'Locataire';

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, phone, preferred_lang, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      req.tenant = {
        id: userId,
        name: profile?.name || rawName,
        email: profile?.email || userEmail,
        phone: profile?.phone || undefined,
        role: (profile as any)?.role || 'tenant',
        preferred_lang: profile?.preferred_lang || 'es',
        avatar_url: profile?.avatar_url || '',
      };
      req.supabaseToken = token;
    }

    next();
  } catch {
    next();
  }
}

/**
 * Middleware requireAdminAuth:
 * Protege rutas de administración exclusivas.
 * Verifica estrictamente que el token sea válido y que el usuario tenga role === 'admin'
 * verificado en la tabla public.profiles (nunca confiando solo en metadatos del cliente).
 */
export async function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.rentia_token) {
      token = req.cookies.rentia_token;
    }

    if (!token) {
      res.status(401).json({ 
        error: 'Acceso denegado: se requiere autenticación de administrador.',
        code: 'ADMIN_AUTH_REQUIRED'
      });
      return;
    }

    // 1. Check local/demo token first
    const localUser = verifyLocalToken(token);
    if (localUser) {
      const isLocalAdmin = localUser.role === 'admin' || ADMIN_EMAILS.includes((localUser.email || '').toLowerCase().trim());
      if (!isLocalAdmin) {
        res.status(403).json({ 
          error: 'Acceso denegado: se requiere rol de Administrador para acceder a esta sección.',
          code: 'ADMIN_ROLE_REQUIRED'
        });
        return;
      }
      req.tenant = {
        id: localUser.id,
        name: localUser.name,
        email: localUser.email,
        role: 'admin',
        is_active: true,
        preferred_lang: localUser.preferred_lang,
      };
      req.supabaseToken = token;
      next();
      return;
    }

    // 2. Supabase Auth verification
    const supabase = getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      // Check if token payload carries an authorized admin email
      try {
        if (token.includes('.')) {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
          const payloadEmail = (payload.email || payload.user_metadata?.email || '').toLowerCase().trim();
          if (payloadEmail && ADMIN_EMAILS.includes(payloadEmail)) {
            const adminUser = findLocalUserByEmail(payloadEmail);
            req.tenant = {
              id: payload.sub || adminUser?.id || 'super-admin-soullis',
              name: payload.user_metadata?.name || adminUser?.name || 'Administrador Rentia',
              email: payloadEmail,
              role: 'admin',
              is_active: true,
              preferred_lang: 'es',
            };
            req.supabaseToken = token;
            next();
            return;
          }
        }
      } catch {}

      res.status(401).json({ error: 'Sesión inválida o expirada.', code: 'INVALID_TOKEN' });
      return;
    }

    const userId = userData.user.id;
    const userEmail = (userData.user.email || '').toLowerCase().trim();

    // Verificación en tabla profiles usando supabaseAdmin para evitar bloqueos por RLS
    const adminClient = getSupabaseAdmin();
    let { data: profile } = await adminClient
      .from('profiles')
      .select('id, name, email, role, is_active')
      .eq('id', userId)
      .maybeSingle();

    const isRecognizedAdmin = ADMIN_EMAILS.includes(userEmail) || profile?.role === 'admin';

    if (!isRecognizedAdmin) {
      res.status(403).json({ 
        error: 'Acceso denegado: Se requiere rol de Administrador para acceder al panel de control.',
        code: 'ADMIN_ROLE_REQUIRED'
      });
      return;
    }

    // Si el usuario es administrador por whitelist pero no tenía role='admin' en profiles, auto-promoverlo
    if (profile && profile.role !== 'admin') {
      try {
        await adminClient.from('profiles').update({ role: 'admin' }).eq('id', userId);
        profile.role = 'admin';
      } catch (promoteErr) {
        console.warn('Admin auto-promote warning:', promoteErr);
      }
    }

    if (!profile) {
      profile = {
        id: userId,
        name: userData.user.user_metadata?.name || userEmail.split('@')[0],
        email: userEmail,
        role: 'admin',
        is_active: true,
      };
      try {
        await adminClient.from('profiles').insert(profile);
      } catch (insertErr) {
        console.warn('Admin profile creation warning:', insertErr);
      }
    }

    if (profile.is_active === false) {
      res.status(403).json({ error: 'Cuenta de administrador suspendida o inactiva.', code: 'ACCOUNT_SUSPENDED' });
      return;
    }

    req.tenant = {
      id: userId,
      name: profile.name,
      email: profile.email,
      role: 'admin',
      is_active: true,
      preferred_lang: 'es',
    };
    req.supabaseToken = token;
    next();
  } catch (err: any) {
    console.error('requireAdminAuth error:', err);
    res.status(403).json({ error: 'Error de autorización administrativa.' });
  }
}


