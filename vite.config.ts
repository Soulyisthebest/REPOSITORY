import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function isValidHttpUrl(str?: string): boolean {
  if (!str) return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default defineConfig(() => {
  const resolvedUrl =
    [process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL, 'https://akdwmpejybmplmmdwwwj.supabase.co'].find(
      isValidHttpUrl
    ) || 'https://akdwmpejybmplmmdwwwj.supabase.co';

  const resolvedKey =
    [
      process.env.SUPABASE_PUBLISHABLE_KEY,
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      process.env.SUPABASE_ANON_KEY,
      process.env.VITE_SUPABASE_ANON_KEY,
      'sb_publishable_J7cpWYILasYWTBFxFXptOw_WjAl9eoY',
    ].find(
      (k) =>
        k &&
        !isValidHttpUrl(k) &&
        !k.startsWith('sb_secret_') &&
        !k.includes('tu_supabase')
    ) || 'sb_publishable_J7cpWYILasYWTBFxFXptOw_WjAl9eoY';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(resolvedUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(resolvedKey),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(resolvedKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
