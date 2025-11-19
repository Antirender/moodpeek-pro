import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPreferences, updatePreferences } from '../lib/api';
import { applyThemePreference, ThemePreference } from '../lib/theme';

export default function PreferencesPage() {
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [defaultCity, setDefaultCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      setStatus('loading');
      try {
        const prefs = await getPreferences();
        if (!isMounted) return;
        setTheme((prefs.theme as ThemePreference) || user?.preferences?.theme || 'system');
        setDefaultCity(prefs.defaultCity || user?.preferences?.defaultCity || '');
        setStatus('idle');
      } catch (err) {
        console.error('Failed to load preferences', err);
        if (isMounted) {
          setTheme(user?.preferences?.theme || 'system');
          setDefaultCity(user?.preferences?.defaultCity || '');
          setStatus('error');
          setError('Unable to load latest preferences. Showing cached values.');
        }
      }
    }

    loadPreferences();
    return () => { isMounted = false; };
  }, [user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus('saving');
    try {
      const updatedUser = await updatePreferences({
        defaultCity,
        theme,
      });
      refreshUser(updatedUser);
      applyThemePreference(updatedUser.preferences?.theme || 'system');
      setStatus('success');
    } catch (err) {
      console.error('Failed to save preferences', err);
      setError('Unable to save preferences right now. Please try again.');
      setStatus('error');
    }
  };

  const saving = status === 'saving';

  return (
    <main className="container preferences-page">
      <section className="preferences-shell">
        <article className="card preferences-card">
          <header className="mb-m">
            <h2>Preferences</h2>
            <p className="muted">These settings are stored in the cloud so your experience stays consistent across devices.</p>
          </header>
          <form className="grid preferences-grid" onSubmit={handleSubmit}>
            <label>
              Default city
              <input
                type="text"
                value={defaultCity}
                onChange={(e) => setDefaultCity(e.target.value)}
                placeholder="Toronto"
                disabled={saving}
              />
            </label>
            <label>
              Theme
              <select value={theme} onChange={(e) => setTheme(e.target.value as ThemePreference)} disabled={saving}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            {status === 'loading' && <p className="muted">Loading your preferences…</p>}
            {status === 'success' && <p className="muted">Preferences synced across all devices.</p>}
            {error && <p className="muted" role="alert" style={{ color: 'var(--pico-danger)' }}>{error}</p>}
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </form>
        </article>
        <article className="card preferences-card account-help-card">
          <header>
            <h3>Account help</h3>
          </header>
          <p className="muted">
            We can&apos;t see your current password, but we can set a new one if you email <a href="mailto:antirender3@gmail.com">antirender3@gmail.com</a> from the address linked to your account. We&apos;ll verify the request and help you get back in.
          </p>
        </article>
      </section>
    </main>
  );
}
