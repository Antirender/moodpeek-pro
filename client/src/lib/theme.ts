// src/lib/theme.ts
const KEY = 'moodpeek_theme';

export type ThemePreference = 'system' | 'light' | 'dark';

let systemListenerCleanup: (() => void) | null = null;

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return preference;
}

function subscribeToSystemPreference() {
  if (typeof window === 'undefined') return;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const stored = getStoredThemePreference();
    if (stored === 'system') {
      const value = media.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  handler();

  if (media.addEventListener) {
    media.addEventListener('change', handler);
    systemListenerCleanup = () => media.removeEventListener('change', handler);
  } else if (media.addListener) {
    media.addListener(handler);
    systemListenerCleanup = () => media.removeListener(handler);
  }
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const stored = window.localStorage.getItem(KEY) as ThemePreference | null;
  if (!stored) {
    return 'system';
  }
  return stored;
}

export function applyThemePreference(preference: ThemePreference) {
  if (systemListenerCleanup) {
    systemListenerCleanup();
    systemListenerCleanup = null;
  }

  const resolved = resolveTheme(preference);
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', resolved);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, preference);
  }

  if (preference === 'system') {
    subscribeToSystemPreference();
  }
}

// Backwards-compatible helper used in legacy entry points like main.jsx
export function getTheme(): ThemePreference {
  return getStoredThemePreference();
}

export function applyTheme(preference?: ThemePreference) {
  const resolvedPreference = preference ?? getStoredThemePreference();
  applyThemePreference(resolvedPreference);
}