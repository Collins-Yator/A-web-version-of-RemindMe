import { EventItem, RecurrenceType } from '../types';

/**
 * Format date nicely with given timezone
 */
export function formatDate(isoString: string, timezone: string = 'Africa/Nairobi'): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Date(isoString).toLocaleDateString();
  }
}

/**
 * Format time nicely
 */
export function formatTime(isoString: string, timezone: string = 'Africa/Nairobi'): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Format 24h clock for timeline e.g. "09:00 AM" or "15:00"
 */
export function formatTime24(isoString: string, timezone: string = 'Africa/Nairobi'): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return '';
  }
}

/**
 * Check if an ISO date string falls on today in the user's timezone
 */
export function isToday(isoString: string, timezone: string = 'Africa/Nairobi'): boolean {
  const targetDate = new Date(isoString);
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(targetDate) === formatter.format(now);
}

/**
 * Check if a date is on the same calendar day in timezone
 */
export function isSameDay(d1: Date | string, d2: Date | string, timezone: string = 'Africa/Nairobi'): boolean {
  const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
  const date2 = typeof d2 === 'string' ? new Date(d2) : d2;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date1) === formatter.format(date2);
}

/**
 * Calculate the next effective occurrence for recurring events
 */
export function getEffectiveStartDateTime(event: EventItem, referenceDate: Date = new Date()): Date {
  const baseStart = new Date(event.startDateTime);
  if (event.recurrenceType === 'NONE') {
    return baseStart;
  }

  // If baseStart is already in the future, return it
  if (baseStart.getTime() >= referenceDate.getTime()) {
    return baseStart;
  }

  const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;
  const current = new Date(baseStart.getTime());

  while (current.getTime() < referenceDate.getTime()) {
    if (event.recurrenceType === 'WEEKLY') {
      current.setDate(current.getDate() + 7);
    } else if (event.recurrenceType === 'MONTHLY') {
      current.setMonth(current.getMonth() + 1);
    } else if (event.recurrenceType === 'YEARLY') {
      current.setFullYear(current.getFullYear() + 1);
    } else {
      break;
    }

    if (recurrenceEnd && current.getTime() > recurrenceEnd.getTime()) {
      // Past recurrence end
      return baseStart;
    }
  }

  return current;
}

/**
 * Generate occurrences for a date range (for calendar view)
 */
export function getOccurrencesForRange(
  event: EventItem,
  rangeStart: Date,
  rangeEnd: Date
): { date: Date; isOccurrence: boolean }[] {
  const results: { date: Date; isOccurrence: boolean }[] = [];
  const baseStart = new Date(event.startDateTime);
  const recurrenceEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : null;

  if (event.recurrenceType === 'NONE') {
    if (baseStart.getTime() >= rangeStart.getTime() && baseStart.getTime() <= rangeEnd.getTime()) {
      results.push({ date: baseStart, isOccurrence: false });
    }
    return results;
  }

  const cursor = new Date(baseStart.getTime());
  // Move cursor forward until within range or stop
  while (cursor.getTime() <= rangeEnd.getTime()) {
    if (recurrenceEnd && cursor.getTime() > recurrenceEnd.getTime()) {
      break;
    }
    if (cursor.getTime() >= rangeStart.getTime()) {
      results.push({
        date: new Date(cursor.getTime()),
        isOccurrence: cursor.getTime() !== baseStart.getTime(),
      });
    }

    if (event.recurrenceType === 'WEEKLY') {
      cursor.setDate(cursor.getDate() + 7);
    } else if (event.recurrenceType === 'MONTHLY') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else if (event.recurrenceType === 'YEARLY') {
      cursor.setFullYear(cursor.getFullYear() + 1);
    } else {
      break;
    }
  }

  return results;
}

/**
 * Human readable countdown to event
 * E.g. "Starts in 47 minutes", "Starts in 2 hours", "Starts in 3 days", "Started 10 minutes ago"
 */
export function getCountdownText(event: EventItem, now: Date = new Date()): { text: string; isPast: boolean; isNow: boolean; diffMinutes: number } {
  const eventTime = getEffectiveStartDateTime(event, now).getTime();
  const nowTime = now.getTime();
  const diffMs = eventTime - nowTime;
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes > 0 && diffMinutes <= 120) {
    if (diffMinutes === 1) return { text: 'Starts in 1 minute', isPast: false, isNow: false, diffMinutes };
    return { text: `Starts in ${diffMinutes} minutes`, isPast: false, isNow: false, diffMinutes };
  } else if (diffMinutes > 120 && diffMinutes <= 1440) {
    const hours = Math.round(diffMinutes / 60);
    return { text: `Starts in ${hours} hours`, isPast: false, isNow: false, diffMinutes };
  } else if (diffMinutes > 1440) {
    const days = Math.round(diffMinutes / 1440);
    return { text: `Starts in ${days} ${days === 1 ? 'day' : 'days'}`, isPast: false, isNow: false, diffMinutes };
  } else if (diffMinutes <= 0 && diffMinutes >= -60) {
    if (diffMinutes === 0) return { text: 'Happening now', isPast: false, isNow: true, diffMinutes };
    return { text: `Started ${Math.abs(diffMinutes)}m ago`, isPast: true, isNow: true, diffMinutes };
  } else {
    const pastMinutes = Math.abs(diffMinutes);
    if (pastMinutes < 1440) {
      return { text: `Ended ${Math.round(pastMinutes / 60)}h ago`, isPast: true, isNow: false, diffMinutes };
    }
    return { text: `Ended ${Math.round(pastMinutes / 1440)}d ago`, isPast: true, isNow: false, diffMinutes };
  }
}

/**
 * Extract preparation bullet points from description
 */
export function extractPreparationNotes(description?: string): string[] {
  if (!description) return [];
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletLines = lines.filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'));
  if (bulletLines.length > 0) {
    return bulletLines.map((l) => l.replace(/^[•\-*]\s*/, ''));
  }

  // If no bullets, split sentences or return as list
  return lines.slice(0, 3);
}

/**
 * Get greeting based on hour of day
 */
export function getDayGreeting(timezone: string = 'Africa/Nairobi'): string {
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(new Date());
    const hour = parseInt(hourStr, 10);
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  } catch {
    return 'Good day';
  }
}
