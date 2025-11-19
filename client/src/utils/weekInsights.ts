// AI Assistance: Content and explanations were generated/refined with ChatGPT (OpenAI, 2025)
// Reference: https://chatgpt.com/share/68fb8e81-9a8c-800c-a2de-44f062fd61b6
// Additional adjustments by the MoodPeek team.
import type { Entry, Mood } from '../types';

export type WeekMetrics = {
  avgScore: number | null;
  gradeLetter: string;
  gradeLabel: string;
  daysLogged: number;
  bestDay?: { label: string; score: number } | null;
  toughDay?: { label: string; score: number } | null;
  topTags: string[];
  summary: string;
};

export type WeekPatternDetails = {
  moodMode: string | null;
  topTag: {
    tag: string;
    entryCount: number;
    dayCount: number;
  } | null;
  daypartMessage: string | null;
};

export const moodScoreMap: Record<Mood | string, number> = {
  happy: 5,
  calm: 4,
  neutral: 3,
  sad: 2,
  stressed: 1,
  VERY_GOOD: 5,
  GOOD: 4,
  NEUTRAL: 3,
  BAD: 2,
  VERY_BAD: 1,
};

export const shortDateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
export const longDayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

export function toStartOfDay(input: string | Date): Date | null {
  const date = (input instanceof Date ? new Date(input) : new Date(input)) as Date;
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function localISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalISO(iso: string): Date {
  const [year, month, day] = iso.split('-').map((part) => parseInt(part, 10));
  const date = new Date(year, (month || 1) - 1, day || 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start;
}

export function endOfWeek(date: Date): Date {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

export function computeWeekMetrics(entries: Entry[]): WeekMetrics {
  if (!entries.length) {
    return {
      avgScore: null,
      gradeLetter: '–',
      gradeLabel: 'No entries yet',
      daysLogged: 0,
      bestDay: null,
      toughDay: null,
      topTags: [],
      summary: 'Add a few reflections to unlock your weekly report.',
    };
  }

  const dayGroups = new Map<string, Entry[]>();
  const tagsFrequency: Record<string, number> = {};
  const values: number[] = [];

  entries.forEach((entry) => {
    const day = toStartOfDay(entry.date);
    if (!day) return;
    const iso = localISO(day);
    if (!dayGroups.has(iso)) {
      dayGroups.set(iso, []);
    }
    dayGroups.get(iso)?.push(entry);

    values.push(moodScoreMap[entry.mood] ?? 3);

    entry.tags?.forEach((tag) => {
      if (!tag) return;
      tagsFrequency[tag] = (tagsFrequency[tag] || 0) + 1;
    });
  });

  const avgScore = values.reduce((sum, value) => sum + value, 0) / values.length;

  const gradeInfo = (() => {
    if (avgScore >= 4.2) return { letter: 'A', label: 'Mostly positive' };
    if (avgScore >= 3.4) return { letter: 'B', label: 'Generally calm' };
    if (avgScore >= 2.6) return { letter: 'C', label: 'Mixed moments' };
    return { letter: 'D', label: 'Challenging week' };
  })();

  const daySummaries = Array.from(dayGroups.entries()).map(([iso, dayEntries]) => {
    const scores = dayEntries.map((entry) => moodScoreMap[entry.mood] ?? 3);
    const score = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const label = longDayFormatter.format(fromLocalISO(iso));
    return { iso, label, score };
  }).sort((a, b) => b.score - a.score);

  const bestDay = daySummaries[0] ? { label: daySummaries[0].label, score: daySummaries[0].score } : null;
  const toughDay = daySummaries.length > 1 ? { label: daySummaries[daySummaries.length - 1].label, score: daySummaries[daySummaries.length - 1].score } : bestDay;

  const topTags = Object.entries(tagsFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);

  const daysLogged = dayGroups.size;

  const summaryBase = {
    A: 'This week was upbeat with consistent check-ins—nice work keeping your energy aligned.',
    B: 'You stayed mostly calm with a few fluctuations. Keep leaning on the habits that help.',
    C: 'There was a blend of highs and lows. Even brief journaling helps spot those inflection points.',
    D: 'This week felt tougher. Treat yourself gently and celebrate any small wins you logged.',
  } as Record<string, string>;

  const summary = `${summaryBase[gradeInfo.letter]} You logged moods on ${daysLogged} of 7 days. Even small, consistent check-ins build awareness.`;

  return {
    avgScore,
    gradeLetter: gradeInfo.letter,
    gradeLabel: gradeInfo.label,
    daysLogged,
    bestDay,
    toughDay,
    topTags,
    summary,
  };
}

export function countDistinctEntryDays(entries: Entry[]): number {
  if (!entries.length) return 0;
  const daySet = new Set<string>();
  entries.forEach((entry) => {
    const day = toStartOfDay(entry.date);
    if (!day) return;
    daySet.add(localISO(day));
  });
  return daySet.size;
}

const EVENING_THRESHOLD = 0.35;
const MORNING_RANGE = { start: 5, end: 12 };
const EVENING_START = 17;

export function deriveWeekPatternDetails(entries: Entry[]): WeekPatternDetails {
  if (!entries.length) {
    return {
      moodMode: null,
      topTag: null,
      daypartMessage: null,
    };
  }

  const moodCounts = new Map<string, number>();
  const tagStats = new Map<string, { count: number; days: Set<string> }>();
  const morning = { sum: 0, count: 0 };
  const evening = { sum: 0, count: 0 };

  entries.forEach((entry) => {
    const mood = entry.mood ?? 'neutral';
    moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);

    const day = toStartOfDay(entry.date);
    const dayIso = day ? localISO(day) : null;

    entry.tags?.forEach((tag) => {
      if (!tag) return;
      if (!tagStats.has(tag)) {
        tagStats.set(tag, { count: 0, days: new Set<string>() });
      }
      const stat = tagStats.get(tag);
      if (!stat) return;
      stat.count += 1;
      if (dayIso) {
        stat.days.add(dayIso);
      }
    });

    const score = moodScoreMap[mood] ?? 3;
    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
    const hour = Number.isNaN(entryDate.getTime()) ? null : entryDate.getHours();
    if (hour === null) return;
    if (hour >= MORNING_RANGE.start && hour < MORNING_RANGE.end) {
      morning.sum += score;
      morning.count += 1;
    } else if (hour >= EVENING_START) {
      evening.sum += score;
      evening.count += 1;
    }
  });

  const moodMode = moodCounts.size
    ? Array.from(moodCounts.entries()).sort((a, b) => {
        if (b[1] === a[1]) return a[0].localeCompare(b[0]);
        return b[1] - a[1];
      })[0][0]
    : null;

  const topTagEntry = tagStats.size
    ? Array.from(tagStats.entries()).sort((a, b) => b[1].count - a[1].count)[0]
    : null;

  const topTag = topTagEntry
    ? {
        tag: topTagEntry[0],
        entryCount: topTagEntry[1].count,
        dayCount: topTagEntry[1].days.size,
      }
    : null;

  let daypartMessage: string | null = null;
  if (morning.count && evening.count) {
    const morningAvg = morning.sum / morning.count;
    const eveningAvg = evening.sum / evening.count;
    if (morningAvg - eveningAvg >= EVENING_THRESHOLD) {
      daypartMessage = 'Evenings seem slightly heavier than mornings.';
    } else if (eveningAvg - morningAvg >= EVENING_THRESHOLD) {
      daypartMessage = 'Mornings dip a bit compared to evenings.';
    } else {
      daypartMessage = 'Mood stays fairly even throughout the day.';
    }
  }

  return { moodMode, topTag, daypartMessage };
}

export function computeStreaks(entries: Entry[]) {
  if (!entries.length) {
    return { current: 0, best: 0, streakDays: new Set<string>() };
  }

  const daySet = new Set(entries.map((entry) => {
    const date = toStartOfDay(entry.date);
    return date ? localISO(date) : null;
  }).filter(Boolean) as string[]);

  const sortedDays = Array.from(daySet).sort();
  let best = 0;
  let streak = 0;
  let previous: Date | null = null;

  sortedDays.forEach((iso) => {
    const day = fromLocalISO(iso);
    if (previous) {
      const diff = day.getTime() - previous.getTime();
      if (diff === 86400000) {
        streak += 1;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    if (streak > best) {
      best = streak;
    }
    previous = day;
  });

  const streakDays = new Set<string>();
  if (sortedDays.length) {
    let cursor = fromLocalISO(sortedDays[sortedDays.length - 1]);
    while (daySet.has(localISO(cursor))) {
      streakDays.add(localISO(cursor));
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return {
    current: streakDays.size,
    best,
    streakDays,
  };
}
