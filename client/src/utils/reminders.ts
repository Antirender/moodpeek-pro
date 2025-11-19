const pad = (value: number) => String(value).padStart(2, '0');

const formatICSDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

export type WeeklyReminderOptions = {
  startDate: Date;
  durationMinutes?: number;
  summary?: string;
  description?: string;
  occurrences?: number;
};

export function buildWeeklyReminderICS({
  startDate,
  durationMinutes = 10,
  summary = 'MoodPeek weekly check-in',
  description = 'Take a minute to reflect on your week in MoodPeek.',
  occurrences = 6,
}: WeeklyReminderOptions) {
  const dtStart = formatICSDate(startDate);
  const dtEnd = formatICSDate(new Date(startDate.getTime() + durationMinutes * 60000));
  const uid = `moodpeek-${startDate.getTime()}@moodpeek.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MoodPeek//Weekly Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `RRULE:FREQ=WEEKLY;COUNT=${occurrences}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadICS(content: string, filename = 'moodpeek-weekly-reminder.ics') {
  const blob = new Blob([content], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
