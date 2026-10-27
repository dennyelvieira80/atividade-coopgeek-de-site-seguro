/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages não permite configurar cabeçalhos HTTP, então a Content Security
 * Policy é injetada como <meta> apenas no build de produção (o servidor de
 * desenvolvimento do Vite usa scripts inline para HMR).
 */
function contentSecurityPolicy(supabaseUrl: string | undefined): Plugin {
  let supabaseOrigin = 'https://*.supabase.co';
  if (supabaseUrl) {
    try {
      supabaseOrigin = new URL(supabaseUrl).origin;
    } catch {
      throw new Error('VITE_SUPABASE_URL inválida.');
    }
  }

  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  return {
    name: 'studyflow-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- CSP -->',
        `<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    // Ex.: "/studyflow-ai/" quando publicado em https://<usuario>.github.io/studyflow-ai/
    base: env.VITE_BASE_PATH || '/',
    plugins: [react(), contentSecurityPolicy(env.VITE_SUPABASE_URL)],
    build: {
      sourcemap: false,
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
