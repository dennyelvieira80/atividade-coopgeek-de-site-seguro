import { Alert } from './Alert';

export function ConfigNotice() {
  return (
    <Alert kind="info">
      <strong>Supabase não configurado.</strong> Copie <code>.env.example</code> para{' '}
      <code>.env.local</code> e preencha <code>VITE_SUPABASE_URL</code> e{' '}
      <code>VITE_SUPABASE_ANON_KEY</code>. Veja o README.
    </Alert>
  );
}
