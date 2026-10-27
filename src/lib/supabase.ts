import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase do navegador.
 * Usa SOMENTE a URL pública e a chave anon/publishable. A autorização real é
 * feita pelo RLS no PostgreSQL e pela verificação de JWT na Edge Function.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
);

/** URL fixa de retorno após confirmação de e-mail (evita open redirect). */
export function authRedirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}
