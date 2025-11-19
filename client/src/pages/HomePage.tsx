// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb8f90-7cea-800c-ab1e-c62b911250db
// Additional refinements made directly in the MoodPeek repo.
import { Fragment, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEntries } from '../api/entries';
import type { Entry } from '../types';
import {
  computeStreaks,
  computeWeekMetrics,
  deriveWeekPatternDetails,
  endOfWeek,
  localISO,
  startOfWeek,
  toStartOfDay,
  shortDateFormatter,
  moodScoreMap,
  type WeekMetrics,
} from '../utils/weekInsights';
import { buildWeeklyReminderICS, downloadICS } from '../utils/reminders';
import WeeklyGoalModal from '../components/WeeklyGoalModal';

const monthNameFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

const today = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

function filterEntriesByRange(entries: Entry[], start: Date, end: Date) {
  return entries.filter((entry) => {
    const day = toStartOfDay(entry.date);
    if (!day) return false;
    return day >= start && day < end;
  });
}

function buildLastSevenDaySeries(entries: Entry[]) {
  const map = new Map<string, number[]>();
  entries.forEach((entry) => {
    const day = toStartOfDay(entry.date);
    if (!day) return;
    const iso = localISO(day);
    if (!map.has(iso)) {
      map.set(iso, []);
    }
    map.get(iso)?.push(moodScoreMap[entry.mood] ?? 3);
  });

  const output: { iso: string; label: string; value: number | null }[] = [];
  const startDay = today();

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(startDay);
    day.setDate(day.getDate() - i);
    const iso = localISO(day);
    const bucket = map.get(iso);
    const value = bucket && bucket.length ? bucket.reduce((sum, val) => sum + val, 0) / bucket.length : null;
    output.push({
      iso,
      label: shortDateFormatter.format(day),
      value,
    });
  }

  return output;
}

function VisitorHome() {
  return (
    <main className="container visitor-home">
      <article className="card hero-card">
        <header className="mb-m">
          <p className="auth-brand">MoodPeek</p>
          <h1>Your mood, made visible.</h1>
          <p className="muted">Track your mood, see patterns over time, and build healthier habits with guided insights.</p>
        </header>
        <div className="hero-actions">
          <Link to="/login" role="button" className="btn-cta">
            Sign in to get started
          </Link>
          <Link to="/register" role="button" className="secondary btn-cta">
            Create a free account
          </Link>
        </div>
      </article>

      <section className="card visitor-feature-card">
        <header>
          <h2>What you can do with MoodPeek</h2>
        </header>
        <div className="visitor-feature-grid">
          <article className="visitor-feature">
            <h3>Daily check-ins</h3>
            <p>Log mood, tags, notes, and location in under a minute so every day has context.</p>
          </article>
          <article className="visitor-feature">
            <h3>Trends & calendar</h3>
            <p>Compare weeks with charts, heatmaps, and a calendar that highlights your patterns.</p>
          </article>
          <article className="visitor-feature">
            <h3>Weekly insights</h3>
            <p>See averages, streaks, and reflection prompts that guide your next habit tweak.</p>
          </article>
        </div>
        <p className="visitor-footnote">How it works: log today’s mood, review patterns in Trends and Calendar, then use weekly insights to adjust your habits.</p>
      </section>

      <section className="card visitor-who-card">
        <div className="visitor-who-grid">
          <div>
            <header>
              <h2>Who is MoodPeek for?</h2>
            </header>
            <ul className="who-list">
              <li>Students tracking study stress</li>
              <li>Remote workers balancing work and life</li>
              <li>Anyone wanting a gentle check-in habit</li>
            </ul>
          </div>
          <div className="visitor-cta-panel">
            <h3>Ready to give MoodPeek a try?</h3>
            <p>Start for free, keep your data private, and fit check-ins into even the busiest days.</p>
            <Link to="/register" role="button" className="btn-cta">
              Create your free account
            </Link>
            <p className="visitor-cta-footnote">No credit card required · You can delete your entries at any time.</p>
          </div>
        </div>
      </section>

      <section className="card visitor-support-card">
        <header>
          <h2>Need password help?</h2>
        </header>
        <p className="muted">
          Forgot your password? Email <a href="mailto:antirender3@gmail.com">antirender3@gmail.com</a> and we'll manually reset it for you.
        </p>
        <p className="muted visitor-support-footnote">We'll verify the request from the email you used for MoodPeek and send back a secure reset.</p>
      </section>

      <section className="card dashboard-privacy visitor-privacy">
        <p className="muted">Data & privacy</p>
        <p>
          MoodPeek uses your entries only to generate your personal mood insights. Your data stays linked to your account, is never sold to third parties, and you can delete your entries at any time.
        </p>
        <div className="privacy-links">
          <Link to="/terms" className="text-link">View terms</Link>
          <Link to="/privacy" className="text-link">Privacy notice</Link>
        </div>
      </section>
    </main>
  );
}

function Sparkline({ data }: { data: { iso: string; label: string; value: number | null }[] }) {
  const values = data.filter((d) => typeof d.value === 'number').map((d) => d.value as number);
  if (!values.length) {
    return <p className="muted">No entries in the last 7 days yet.</p>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const height = 48;
  const width = Math.max(120, (data.length - 1) * 24);
  const horizontalSteps = Math.max(1, data.length - 1);
  const yScale = max === min ? () => height / 2 : (value: number) => height - ((value - min) / (max - min)) * height;

  const points = data.map((point, index) => {
    const x = (index / horizontalSteps) * width;
    const y = typeof point.value === 'number' ? yScale(point.value) : height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Fragment>
      <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
      </svg>
      <div className="sparkline-labels">
        {data.map((point) => (
          <span key={point.iso}>{point.label}</span>
        ))}
      </div>
    </Fragment>
  );
}

function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { entries, isLoading } = useEntries();
  const entriesCount = entries.length;
  const [isWeeklyGoalOpen, setWeeklyGoalOpen] = useState(false);

  const weekStart = startOfWeek(today());
  const weekEndExclusive = (() => {
    const end = endOfWeek(weekStart);
    end.setDate(end.getDate() + 1);
    return end;
  })();
  const weekKey = `${weekStart.getTime()}-${weekEndExclusive.getTime()}`;

  const weekEntries = useMemo(() => filterEntriesByRange(entries, weekStart, weekEndExclusive), [entries, weekKey]);
  const weekMetrics = useMemo<WeekMetrics>(() => computeWeekMetrics(weekEntries), [weekEntries]);
  const weekPatternDetails = useMemo(() => deriveWeekPatternDetails(weekEntries), [weekEntries]);
  const showWeekMetrics = weekEntries.length > 0 && typeof weekMetrics.avgScore === 'number';
  const streakInfo = useMemo(() => computeStreaks(entries), [entries]);
  const todayIso = useMemo(() => localISO(today()), []);
  const hasTodayEntry = useMemo(() => entries.some((entry) => {
    const day = toStartOfDay(entry.date);
    return day ? localISO(day) === todayIso : false;
  }), [entries, todayIso]);
  const heroPrimaryLabel = hasTodayEntry ? "Update today's mood" : "Record today's mood";
  const lastSeven = useMemo(() => buildLastSevenDaySeries(entries), [entries]);

  const monthLoggedDays = useMemo(() => {
    const now = today();
    const month = now.getMonth();
    const year = now.getFullYear();
    const daySet = new Set<string>();
    entries.forEach((entry) => {
      const day = toStartOfDay(entry.date);
      if (!day) return;
      if (day.getMonth() === month && day.getFullYear() === year) {
        daySet.add(localISO(day));
      }
    });
    return daySet.size;
  }, [entries]);

  const weekRangeLabel = `${shortDateFormatter.format(weekStart)} – ${shortDateFormatter.format(new Date(weekEndExclusive.getTime() - 86400000))}`;

  const quickLinks = [
    { label: 'New entry', action: () => navigate('/entries?date=today') },
    { label: 'View calendar', action: () => navigate('/calendar#weekly') },
    { label: 'See weekly report', action: () => navigate('/calendar#weekly') },
    { label: 'Preferences & theme', action: () => navigate('/preferences') },
  ];

  const weekPatternSummary = useMemo(() => {
    const parts: string[] = [];
    if (weekPatternDetails.moodMode) {
      const normalized = weekPatternDetails.moodMode.replace(/_/g, ' ').toLowerCase();
      const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      parts.push(`Most common mood: ${label}`);
    }
    if (weekPatternDetails.topTag) {
      parts.push(`Top tag: ${weekPatternDetails.topTag.tag}`);
    }
    if (weekPatternDetails.daypartMessage) {
      parts.push(weekPatternDetails.daypartMessage);
    }
    return parts.join(' · ');
  }, [weekPatternDetails]);

  const showFirstTimeStrip = !isLoading && entriesCount === 0;
  const weeklyGoalTarget = useMemo(() => Math.min(7, Math.max(5, (streakInfo.current || 0) + 2)), [streakInfo.current]);
  const streakMessage = streakInfo.current
    ? `You've checked in ${streakInfo.current} ${streakInfo.current === 1 ? 'day' : 'days'} in a row. Aim for ${weeklyGoalTarget} days this week?`
    : 'No streak yet—aim for 3 quick check-ins this week to build momentum.';

  const openGoalDialog = () => setWeeklyGoalOpen(true);
  const closeGoalDialog = () => setWeeklyGoalOpen(false);
  const handleDownloadReminder = () => {
    const reminderStart = startOfWeek(today());
    reminderStart.setDate(reminderStart.getDate() + 7);
    reminderStart.setHours(9, 0, 0, 0);
    const ics = buildWeeklyReminderICS({
      startDate: reminderStart,
      summary: 'MoodPeek weekly goal',
      description: 'Log a weekly reflection in MoodPeek and celebrate progress.',
    });
    downloadICS(ics);
    closeGoalDialog();
  };

  return (
    <main className="container dashboard-home">
      <article className="card hero-card dashboard-hero">
        <p className="auth-brand">MoodPeek</p>
        <p className="muted">Welcome back{user?.email ? `, ${user.email}` : ''}</p>
        <h1>Ready to keep your streak going?</h1>
        <p className="muted">Record today’s mood, check the calendar, or jump into your weekly report in one click.</p>
        <div className="hero-actions">
          <button type="button" className="btn-cta" onClick={() => navigate('/entries?date=today')}>
            {heroPrimaryLabel}
          </button>
          <button type="button" className="secondary btn-cta" onClick={() => navigate('/calendar#weekly')}>
            Open calendar
          </button>
        </div>
      </article>

      {showFirstTimeStrip && (
        <section className="card onboarding-strip" aria-live="polite">
          <div>
            <p className="muted">First-time setup</p>
            <h3>Your first mood unlocks everything else</h3>
            <p className="onboarding-steps">Step 1: Log your first mood · Step 2: Explore the calendar · Step 3: Check your weekly report after a few days.</p>
          </div>
          <div className="onboarding-actions">
            <button type="button" className="btn-cta" onClick={() => navigate('/entries?date=today')}>
              Log first mood
            </button>
            <button type="button" className="secondary btn-cta" onClick={() => navigate('/calendar')}>
              Explore calendar
            </button>
          </div>
        </section>
      )}

      <section className="dashboard-grid">
        <article className="card dashboard-card">
          <header>
            <p className="muted">This week at a glance</p>
            <h3>{weekRangeLabel}</h3>
          </header>
          {showWeekMetrics ? (
            <div className="week-glance">
              <p className="week-score">Average mood: {weekMetrics.avgScore!.toFixed(1)} / 5</p>
              <p className="week-grade">
                Grade: {weekMetrics.gradeLetter} · {weekMetrics.gradeLabel}
              </p>
              {weekPatternSummary && (
                <p className="muted week-pattern-summary">{weekPatternSummary}</p>
              )}
              <p className="muted">
                {weekMetrics.summary}
              </p>
            </div>
          ) : (
            <p className="muted">No entries yet this week—add a few check-ins to unlock your weekly report.</p>
          )}
          <button type="button" className="text-link" onClick={() => navigate('/calendar#weekly')}>
            Review weekly details →
          </button>
        </article>

        <article className="card dashboard-card">
          <header>
            <p className="muted">Last 7 days trend</p>
            <h3>Mood score trend</h3>
          </header>
          <Sparkline data={lastSeven} />
          <p className="muted">Mood score over the last 7 days</p>
          <button type="button" className="text-link" onClick={() => navigate('/trends#trend-chart')}>
            Open Trends →
          </button>
        </article>

        <article className="card dashboard-card">
          <header>
            <p className="muted">Quick links</p>
            <h3>Jump back in</h3>
          </header>
          <div className="quick-links">
            {quickLinks.map((item) => (
              <button key={item.label} type="button" className="secondary btn-cta" onClick={item.action}>
                {item.label}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="card dashboard-card streak-card">
        <header>
          <p className="muted">Habits & streaks</p>
          <h3>Small, consistent check-ins add up</h3>
        </header>
        <div className="streak-stats">
          <div>
            <p className="streak-value">{streakInfo.current}</p>
            <p className="muted">Day streak</p>
          </div>
          <div>
            <p className="streak-value">{monthLoggedDays}</p>
            <p className="muted">Days logged in {monthNameFormatter.format(today())}</p>
          </div>
        </div>
        <button type="button" className="secondary btn-cta goal-button" onClick={openGoalDialog}>
          Set weekly goal
        </button>
        <p className="muted">{streakMessage}</p>
      </section>

      <section className="dashboard-privacy" aria-live="polite">
        <p className="muted">Data & privacy</p>
        <p>
          MoodPeek uses your entries only to generate your personal mood insights. Your data stays linked to your account, is never sold to third parties, and you can delete your entries at any time.
        </p>
        <div className="privacy-links">
          <Link to="/terms" className="text-link">View terms</Link>
          <Link to="/privacy" className="text-link">Privacy notice</Link>
        </div>
      </section>

      <WeeklyGoalModal
        open={isWeeklyGoalOpen}
        onClose={closeGoalDialog}
        targetCheckins={weeklyGoalTarget}
        onDownloadReminder={handleDownloadReminder}
      />

      {isLoading && <p className="muted" aria-live="polite">Loading your recent entries…</p>}
    </main>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  if (!user) {
    return <VisitorHome />;
  }
  return <DashboardHome />;
}
