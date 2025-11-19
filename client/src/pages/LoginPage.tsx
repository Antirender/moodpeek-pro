import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      const redirectTo = ((location.state as { from?: { pathname?: string } })?.from?.pathname) || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container auth-page" aria-busy={isLoading}>
      <section className="auth-shell">
        <article className="card auth-card">
          <header className="mb-m">
            <p className="auth-brand">MoodPeek</p>
            <h1>Sign in to MoodPeek</h1>
            <p className="muted">Enter your email and password to access your mood journal.</p>
          </header>
          <form onSubmit={handleSubmit} className="grid form-grid">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>
            {error && (
              <p role="alert" className="muted" style={{ color: 'var(--pico-danger)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
            <p className="muted password-help-inline">
              Forgot your password?{' '}
              <a href="mailto:antirender3@gmail.com">Email us</a>
              {' '}and we'll manually reset it for you.
            </p>
          </form>
          <footer style={{ marginTop: '1rem' }}>
            <p className="muted">
              Don't have an account yet?{' '}
              <Link to="/register">Sign up now</Link>
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}
