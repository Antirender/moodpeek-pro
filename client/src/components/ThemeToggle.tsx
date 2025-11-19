// src/components/ThemeToggle.tsx
import { useEffect, useMemo, useState } from "react";
import { applyThemePreference, getStoredThemePreference, ThemePreference } from "../lib/theme";
import { updatePreferences } from "../lib/api";
import { useAuth } from "../context/AuthContext";
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb7f17-3f1c-800c-8e20-adf8340fb1dd
// Add/remove/refine more details by myself
const THEME_SEQUENCE: ThemePreference[] = ['light', 'dark', 'system'];

export default function ThemeToggle(){
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const pref = user?.preferences?.theme ?? getStoredThemePreference();
    setTheme(pref);
    applyThemePreference(pref);
  }, [user]);

  const label = useMemo(() => {
    switch (theme) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      default:
        return 'System';
    }
  }, [theme]);

  const nextTheme = () => {
    const currentIndex = THEME_SEQUENCE.indexOf(theme);
    const next = THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length];
    return next;
  };

  const toggle = async () => {
    const next = nextTheme();
    setTheme(next);
    applyThemePreference(next);

    if (user) {
      try {
        setIsSaving(true);
        const updatedUser = await updatePreferences({ theme: next });
        refreshUser(updatedUser);
      } catch (error) {
        console.error('Failed to update theme preference', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <button className="secondary" onClick={toggle} aria-pressed={theme === 'dark'} disabled={isSaving}>
      {label}
    </button>
  );
}