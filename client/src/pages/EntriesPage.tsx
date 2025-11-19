import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import EntriesHelp from '../components/EntriesHelp';
import { localISO, startOfWeek, toStartOfDay } from '../utils/weekInsights';
import { showToast } from '../components/ToastHost';
import '../styles/charts.css';
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb7b6c-bc20-800c-af73-9729ade1663c
// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fae879-9770-800c-b09b-b242fb0d0f1c
// Add/remove/refine more details by myself

export default function EntriesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const newEntryRef = useRef<HTMLElement | null>(null);
  const hasAppliedQueryRef = useRef(false);

  useEffect(() => {
    if (hasAppliedQueryRef.current) return;
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (!dateParam) return;

    let resolvedDate: string | undefined;
    if (dateParam === 'today') {
      resolvedDate = localISO(new Date());
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      resolvedDate = dateParam;
    }

    if (!resolvedDate) return;

    setPrefillDate((prev) => prev ?? resolvedDate);
    hasAppliedQueryRef.current = true;

    requestAnimationFrame(() => {
      newEntryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = newEntryRef.current?.querySelector<HTMLElement>('input, textarea, select, button');
      firstInput?.focus();
    });
  }, [location.search]);

  const handleEntrySaved = (savedDate?: string) => {
    if (!savedDate) return;
    const normalized = toStartOfDay(savedDate);
    if (!normalized) return;
    const weekStartIso = localISO(startOfWeek(normalized));
    showToast({
      message: 'Entry saved',
      actionLabel: 'See it in your calendar →',
      onAction: () => navigate(`/calendar?start=${weekStartIso}#weekly`),
    });
  };

  return (
    <main className="container">
      <header style={{ marginBottom: '1.5rem' }}>
        <h2>Mood Entries</h2>
        <p style={{ color: 'var(--pico-muted-color)' }}>
          Track your daily mood, activities, and notes to understand your emotional patterns.
        </p>
      </header>
      
      <EntriesHelp defaultOpen={false} />
      
      <div className="grid-2 mt-m">
        <div>
          <article ref={newEntryRef} id="new-entry-panel">
            <header>
              <h3>New Entry</h3>
            </header>
            <EntryForm initialDate={prefillDate} onSuccess={handleEntrySaved} />
          </article>
        </div>
        
        <div>
          <article>
            <header>
              <h3>Your Entries</h3>
            </header>
            <EntryList />
          </article>
        </div>
      </div>
    </main>
  );
}