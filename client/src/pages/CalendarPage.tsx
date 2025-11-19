import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEntries } from '../api/entries';
import type { Entry, Mood } from '../types';
import {
  computeStreaks,
  computeWeekMetrics,
  countDistinctEntryDays,
  deriveWeekPatternDetails,
  endOfWeek,
  fromLocalISO,
  localISO,
  startOfWeek,
  toStartOfDay,
  shortDateFormatter,
  longDayFormatter,
  type WeekMetrics,
} from '../utils/weekInsights';
import '../styles/calendar.css';

type WeekDay = {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
  hasEntries: boolean;
  isToday: boolean;
  isStreakDay: boolean;
};

type WeekRow = {
  start: Date;
  days: WeekDay[];
};

const moodEmojiMap: Record<Mood | string, string> = {
  happy: '😄',
  calm: '😌',
  neutral: '😐',
  sad: '😔',
  stressed: '😣',
  VERY_GOOD: '😄',
  GOOD: '🙂',
  NEUTRAL: '😐',
  BAD: '☁️',
  VERY_BAD: '😣',
};
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

function buildMonthMatrix(viewDate: Date, entriesByDay: Map<string, Entry[]>, streakDays: Set<string>): WeekRow[] {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const lastOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const matrixStart = startOfWeek(firstOfMonth);
  const matrixEnd = endOfWeek(lastOfMonth);
  const todayIso = localISO(new Date());

  const weeks: WeekRow[] = [];
  const cursor = new Date(matrixStart);

  while (cursor <= matrixEnd) {
    const weekStart = new Date(cursor);
    const days: WeekDay[] = [];

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      day.setHours(0, 0, 0, 0);
      const iso = localISO(day);
      days.push({
        date: day,
        iso,
        isCurrentMonth: day.getMonth() === viewDate.getMonth(),
        hasEntries: entriesByDay.has(iso),
        isToday: iso === todayIso,
        isStreakDay: streakDays.has(iso),
      });
    }

    weeks.push({ start: weekStart, days });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}


function CalendarPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialStartRef = useRef(searchParams.get('start'));
  const initialWeek = useMemo(() => {
    const startParam = initialStartRef.current;
    if (startParam) {
      const parsed = toStartOfDay(startParam);
      if (parsed) {
        return startOfWeek(parsed);
      }
    }
    return startOfWeek(new Date());
  }, []);

  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(initialWeek);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const firstOfMonth = new Date(initialWeek);
    firstOfMonth.setDate(1);
    return firstOfMonth;
  });
  const { entries, isLoading } = useEntries();
  const weeklyPanelRef = useRef<HTMLElement | null>(null);
  const hasScrolledToWeeklyRef = useRef(false);

  useEffect(() => {
    if (hasScrolledToWeeklyRef.current) return;
    if (location.hash !== '#weekly') return;
    hasScrolledToWeeklyRef.current = true;
    requestAnimationFrame(() => {
      weeklyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  const streakInfo = useMemo(() => computeStreaks(entries), [entries]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    entries.forEach((entry) => {
      const date = toStartOfDay(entry.date);
      if (!date) return;
      const iso = localISO(date);
      if (!map.has(iso)) {
        map.set(iso, []);
      }
      map.get(iso)?.push(entry);
    });
    return map;
  }, [entries]);

  const weeks = useMemo(
    () => buildMonthMatrix(visibleMonth, entriesByDay, streakInfo.streakDays),
    [visibleMonth, entriesByDay, streakInfo.streakDays]
  );

  const weekEntries = useMemo(() => {
    if (!entries.length) return [];
    const start = startOfWeek(selectedWeekStart);
    const end = endOfWeek(selectedWeekStart);
    end.setDate(end.getDate() + 1);
    return entries
      .filter((entry) => {
        const date = toStartOfDay(entry.date);
        if (!date) return false;
        return date >= start && date < end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entries, selectedWeekStart]);

  const weekMetrics = useMemo<WeekMetrics>(() => computeWeekMetrics(weekEntries), [weekEntries]);
  const weekPatternDetails = useMemo(() => deriveWeekPatternDetails(weekEntries), [weekEntries]);
  const weekDayCount = useMemo(() => countDistinctEntryDays(weekEntries), [weekEntries]);
  const hasWeekReport = weekDayCount >= 2;

  const groupedWeekEntries = useMemo(() => {
    const groups = new Map<string, Entry[]>();
    weekEntries.forEach((entry) => {
      const date = toStartOfDay(entry.date);
      if (!date) return;
      const iso = localISO(date);
      if (!groups.has(iso)) {
        groups.set(iso, []);
      }
      groups.get(iso)?.push(entry);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => fromLocalISO(a).getTime() - fromLocalISO(b).getTime())
      .map(([iso, dayEntries]) => ({
        iso,
        label: longDayFormatter.format(fromLocalISO(iso)),
        entries: dayEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      }));
  }, [weekEntries]);

  const weekHeading = (() => {
    const startLabel = shortDateFormatter.format(selectedWeekStart);
    const endLabel = shortDateFormatter.format(endOfWeek(selectedWeekStart));
    return `Week of ${startLabel} – ${endLabel}`;
  })();

  const selectWeek = (date: Date) => {
    const nextWeek = startOfWeek(date);
    setSelectedWeekStart(nextWeek);
    const nextVisible = new Date(nextWeek);
    nextVisible.setDate(1);
    setVisibleMonth(nextVisible);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + (direction === 'prev' ? -1 : 1));
    next.setDate(1);
    setVisibleMonth(next);

    const targetMatchesSelected =
      selectedWeekStart.getFullYear() === next.getFullYear() &&
      selectedWeekStart.getMonth() === next.getMonth();

    if (!targetMatchesSelected) {
      setSelectedWeekStart(startOfWeek(next));
    }
  };

  return (
    <main className="container">
      <div className="calendar-layout">
        <section className="card calendar-card">
          <div className="calendar-header">
            <div>
              <p className="muted">Select a week to review detailed insights</p>
              <h2>{monthFormatter.format(visibleMonth)}</h2>
            </div>
            <div className="calendar-month-nav">
              <button type="button" onClick={() => changeMonth('prev')} aria-label="Previous month">
                ←
              </button>
              <button type="button" onClick={() => changeMonth('next')} aria-label="Next month">
                →
              </button>
            </div>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {weeks.map((week) => {
              const isSelected = localISO(week.start) === localISO(startOfWeek(selectedWeekStart));
              return (
                <div
                  key={week.start.toISOString()}
                  className={`calendar-week ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectWeek(week.start)}
                >
                  {week.days.map((day) => (
                    <button
                      key={day.iso}
                      type="button"
                      className={`calendar-day ${day.isCurrentMonth ? '' : 'outside'} ${day.hasEntries ? 'has-entries' : ''} ${day.isToday ? 'today' : ''} ${streakInfo.streakDays.has(day.iso) ? 'streak' : ''} ${localISO(startOfWeek(day.date)) === localISO(selectedWeekStart) ? 'active-week' : ''}`}
                      onClick={() => selectWeek(day.date)}
                    >
                      <span>{day.date.getDate()}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <section id="weekly-panel" className="card week-panel" ref={weeklyPanelRef}>
          <header>
            <p className="muted">Weekly mood report</p>
            <h2>{weekHeading}</h2>
            <p className="muted">Weekly mood report based on your entries.</p>
          </header>

          <div className="streak-card">
            <div>
              <p className="muted">Current streak</p>
              <strong>{streakInfo.current} {streakInfo.current === 1 ? 'day' : 'days'}</strong>
            </div>
            <div>
              <p className="muted">Best streak</p>
              <strong>{streakInfo.best} {streakInfo.best === 1 ? 'day' : 'days'}</strong>
            </div>
            <p className="muted">Great job keeping up your reflection habit.</p>
          </div>

          {hasWeekReport ? (
            <>
              <div className="week-metrics-grid">
                <div className="metric-card">
                  <p className="muted">Average mood</p>
                  <strong>
                    {weekMetrics.avgScore !== null && Number.isFinite(weekMetrics.avgScore)
                      ? `${weekMetrics.avgScore.toFixed(1)} / 5`
                      : '—'}
                  </strong>
                  <span>{weekMetrics.gradeLetter} · {weekMetrics.gradeLabel}</span>
                </div>
                <div className="metric-card">
                  <p className="muted">Days logged</p>
                  <strong>{weekMetrics.daysLogged} of 7</strong>
                  <span>Consistent check-ins build awareness.</span>
                </div>
                <div className="metric-card">
                  <p className="muted">Best day</p>
                  <strong>{weekMetrics.bestDay ? weekMetrics.bestDay.label : '—'}</strong>
                  {weekMetrics.bestDay && <span>{weekMetrics.bestDay.score.toFixed(1)} / 5</span>}
                </div>
                <div className="metric-card">
                  <p className="muted">Tough day</p>
                  <strong>{weekMetrics.toughDay ? weekMetrics.toughDay.label : '—'}</strong>
                  {weekMetrics.toughDay && <span>{weekMetrics.toughDay.score.toFixed(1)} / 5</span>}
                </div>
              </div>

              <p className="week-summary">{weekMetrics.summary}</p>

              <div className="top-tags">
                <p className="muted">Top tags</p>
                <div>
                  {weekMetrics.topTags.length ? weekMetrics.topTags.map((tag) => (
                    <span key={tag} className="tag-chip">{tag}</span>
                  )) : (
                    <span className="muted">No tags for this week.</span>
                  )}
                </div>
              </div>

              <div className="tag-highlight">
                <p className="muted">Tag highlight</p>
                {weekPatternDetails.topTag ? (
                  <div>
                    <p>Most-used tag this week: "{weekPatternDetails.topTag.tag}" ({weekPatternDetails.topTag.entryCount} {weekPatternDetails.topTag.entryCount === 1 ? 'entry' : 'entries'})</p>
                    <p className="muted">{weekPatternDetails.topTag.tag} showed up on {weekPatternDetails.topTag.dayCount} / 7 days.</p>
                  </div>
                ) : (
                  <p className="muted">No tags yet – add a few tags to see highlights here.</p>
                )}
              </div>
            </>
          ) : (
            <div className="week-placeholder">
              <h3>Come back after a few check-ins</h3>
              <p className="muted">We need at least 2 days of entries to unlock this weekly report. Right now we have {weekDayCount} logged {weekDayCount === 1 ? 'day' : 'days'} for this range.</p>
              <button type="button" className="btn-cta" onClick={() => navigate('/entries?date=today')}>
                Log today’s mood
              </button>
            </div>
          )}

          <div className="week-entries">
            <h3>Entries this week</h3>
            {!weekEntries.length && (
              <p className="muted">No entries yet. Capture a quick note to see it here.</p>
            )}
            {groupedWeekEntries.map((group) => (
              <article key={group.iso} className="week-entry-card">
                <div className="week-entry-day">
                  <strong>{group.label}</strong>
                  <span>{group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div className="week-entry-items">
                  {group.entries.map((entry) => (
                    <div key={entry._id ?? `${group.iso}-${entry.mood}-${entry.note}` } className="week-entry-item">
                      <div className="mood-chip">{moodEmojiMap[entry.mood] || '🙂'}</div>
                      <div>
                        <div className="entry-meta-row">
                          <span>{timeFormatter.format(new Date(entry.date))}</span>
                          {entry.city && (
                            <span>· {entry.city}</span>
                          )}
                          <span>· {entry.mood}</span>
                        </div>
                        {entry.note && (
                          <p className="entry-note">{entry.note.length > 140 ? `${entry.note.slice(0, 140)}…` : entry.note}</p>
                        )}
                        {entry.tags?.length ? (
                          <div className="entry-tags">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="entry-tag">{tag}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
      {isLoading && <progress aria-label="Loading entries" />}
    </main>
  );
}

export default CalendarPage;
