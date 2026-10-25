import { createClient, SupabaseClient } from '@supabase/supabase-js';

function isValidHttpUrl(str?: unknown): boolean {
  if (typeof str !== 'string' || !str.trim()) return false;
  const s = str.trim();
  if (!s.startsWith('http://') && !s.startsWith('https://')) return false;
  try {
    const url = new URL(s);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export const getSupabaseUrl = (): string => {
  const candidates = [
    process.env.SUPABASE_URL,
    process.env.VITE_SUPABASE_URL,
  ];
  for (const candidate of candidates) {
    if (isValidHttpUrl(candidate) && !candidate?.includes('TU_PROYECTO')) {
      return candidate!.trim();
    }
  }
  return '';
};

export const getSupabaseAnonKey = (): string => {
  const candidates = [
    process.env.SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ];
  for (const c of candidates) {
    if (
      typeof c === 'string' &&
      c.trim() &&
      !isValidHttpUrl(c) &&
      !c.startsWith('sb_secret_') &&
      !c.includes('tu_supabase') &&
      !c.includes('placeholder')
    ) {
      return c.trim();
    }
  }
  return '';
};

export const getSupabaseSecretKey = (): string => {
  const candidates = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() && !c.includes('tu_supabase')) return c.trim();
  }
  return '';
};

let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(
    url &&
    key &&
    isValidHttpUrl(url) &&
    !url.includes('TU_PROYECTO') &&
    !key.includes('tu_supabase')
  );
};

export function assertSupabaseConfiguration(): void {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) {
    console.warn('WARNING: Supabase credentials are missing or default. Server will operate with local resilient store fallback.');
    return;
  }
  console.log(`Supabase initialized successfully (${url})`);
}

const FALLBACK_URL = 'https://fallback-rentia-local.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export function getSupabase(userToken?: string): SupabaseClient {
  const url = getSupabaseUrl() || FALLBACK_URL;
  const key = getSupabaseAnonKey() || FALLBACK_KEY;

  if (userToken) {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    });
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl() || FALLBACK_URL;
  const secret = getSupabaseSecretKey() || getSupabaseAnonKey() || FALLBACK_KEY;

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminInstance;
}

