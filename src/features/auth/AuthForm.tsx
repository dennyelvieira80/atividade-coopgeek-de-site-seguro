import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Alert } from '../../components/Alert';
import { authRedirectUrl, supabase } from '../../lib/supabase';

const CredentialsSchema = z.object({
  email: z.string().trim().email('E-mail inválido.').max(254),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.'),
});

type Mode = 'signIn' | 'signUp';

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const parsed = CredentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
        // Mensagem genérica: não revela se o e-mail existe (enumeração de usuários).
        if (signInError) setError('E-mail ou senha incorretos.');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: authRedirectUrl() },
        });
        if (signUpError) {
          setError('Não foi possível criar a conta. Tente novamente mais tarde.');
        } else {
          setInfo('Se o e-mail for válido, você receberá um link de confirmação.');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card auth-card" aria-labelledby="auth-title">
      <h2 id="auth-title">{mode === 'signIn' ? 'Entrar' : 'Criar conta'}</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            name="password"
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <Alert kind="error">{error}</Alert>}
        {info && <Alert kind="success">{info}</Alert>}

        <button type="submit" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'signIn' ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>

      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
          setError(null);
          setInfo(null);
        }}
      >
        {mode === 'signIn' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
      </button>
    </section>
  );
}
