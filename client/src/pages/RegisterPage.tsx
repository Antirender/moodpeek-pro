import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    defaultCity: '',
    theme: 'system',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        defaultCity: form.defaultCity || undefined,
        theme: form.theme as 'system' | 'light' | 'dark',
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container auth-page">
      <section className="auth-shell">
        <article className="card auth-card">
          <header className="mb-m">
            <p className="auth-brand">MoodPeek</p>
            <h1>Create your account</h1>
            <p className="muted">Start tracking your moods, habits, and weekly insights.</p>
          </header>
          <form onSubmit={handleSubmit} className="grid form-grid">
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Create a password"
                required
                minLength={8}
              />
              <small className="muted">Use at least 8 characters.</small>
            </label>
            <label>
              Confirm password
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </label>
            <label>
              Default city (optional)
              <input
                type="text"
                value={form.defaultCity}
                onChange={(e) => updateField('defaultCity', e.target.value)}
                placeholder="Toronto, Vancouver, ..."
              />
            </label>
            <label>
              Theme preference
              <select
                value={form.theme}
                onChange={(e) => updateField('theme', e.target.value)}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            {error && (
              <p role="alert" className="muted" style={{ color: 'var(--pico-danger)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing up…' : 'Sign up'}
            </button>
          </form>
          <footer style={{ marginTop: '1rem' }}>
            <p className="muted">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </footer>
        </article>
      </section>
    </main>
  );
}
