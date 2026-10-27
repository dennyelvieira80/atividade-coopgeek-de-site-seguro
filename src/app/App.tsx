import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ConfigNotice } from '../components/ConfigNotice';
import { AuthForm } from '../features/auth/AuthForm';
import { useSession } from '../features/auth/useSession';
import { Dashboard } from '../features/plans/Dashboard';

export function App() {
  const { session, loading } = useSession();

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudyFlow AI</h1>
        {session && (
          <div className="user-box">
            <span className="muted">{session.user.email}</span>
            <button type="button" className="secondary" onClick={() => supabase.auth.signOut()}>
              Sair
            </button>
          </div>
        )}
      </header>

      <main>
        {!isSupabaseConfigured ? (
          <ConfigNotice />
        ) : loading ? (
          <p className="muted">Carregando…</p>
        ) : session ? (
          <Dashboard />
        ) : (
          <AuthForm />
        )}
      </main>

      <footer className="app-footer muted">
        Planos gerados por IA podem conter erros. Não insira dados pessoais sensíveis.
      </footer>
    </div>
  );
}
