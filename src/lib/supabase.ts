import { createClient } from '@supabase/supabase-js';

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

// Resolve URL defensively: ensure it is strictly a valid HTTP/HTTPS URL and not an API key
function resolveUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (isValidHttpUrl(envUrl) && !envUrl.includes('TU_PROYECTO')) return envUrl.trim();

  const fallbackEnv = (import.meta.env as Record<string, string | undefined>).SUPABASE_URL;
  if (isValidHttpUrl(fallbackEnv) && !fallbackEnv.includes('TU_PROYECTO')) return fallbackEnv!.trim();

  return 'https://placeholder.supabase.co';
}

// Resolve Key defensively: ensure it is not a URL, not a secret key, and not a placeholder
function resolveKey(): string {
  const candidates = [
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    (import.meta.env as Record<string, string | undefined>).SUPABASE_PUBLISHABLE_KEY,
    (import.meta.env as Record<string, string | undefined>).SUPABASE_ANON_KEY,
  ];

  for (const k of candidates) {
    if (
      typeof k === 'string' &&
      k.trim() &&
      !isValidHttpUrl(k) &&
      !k.startsWith('sb_secret_') &&
      !k.includes('tu_supabase') &&
      !k.includes('placeholder')
    ) {
      return k.trim();
    }
  }

  return 'placeholder_anon_key';
}

export const SUPABASE_URL = resolveUrl();
export const SUPABASE_ANON_KEY = resolveKey();

export const isClientSupabaseConfigured = (): boolean => {
  return (
    SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    SUPABASE_ANON_KEY !== 'placeholder_anon_key' &&
    isValidHttpUrl(SUPABASE_URL) &&
    !SUPABASE_URL.includes('TU_PROYECTO')
  );
};

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

