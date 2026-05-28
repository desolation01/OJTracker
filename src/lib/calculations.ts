import { dateKeyToUTCDate, getDateKeyInTimeZone, utcDateToDateKey } from "@/lib/date";
import { isPhHolidayDateKey } from "@/lib/ph-holidays";
import type { EntryDTO, UserSettingsDTO } from "@/types";

export interface StatsResult {
  totalMinutes: number;
  totalHours: number;
  targetHours: number;
  remainingMinutes: number;
  remainingHours: number;
  percentComplete: number;
  estimatedDaysLeft: number;
  estimatedCompletionDate: string | null;
  entryCount: number;
  currentStreak: number;
  defaultHoursPerDay: number;
  daysOff: number[];
  holidays: string[];
  timezone: string;
}

function computeCurrentStreak(entries: EntryDTO[]) {
  const dates = new Set(
    entries
      .filter((entry) => entry.hours * 60 + entry.minutes > 0)
      .map((entry) => entry.date),
  );

  let streak = 0;
  const cursor = new Date();

  // If there is no entry for today, allow streak to start from yesterday.
  for (let offset = 0; offset < 3650; offset += 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
      continue;
    }
    if (offset === 0) {
      continue;
    }
    break;
  }

  return streak;
}

export function calculateStats(entries: EntryDTO[], settings: UserSettingsDTO): StatsResult {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.hours * 60 + entry.minutes, 0);
  const targetMinutes = settings.targetHours * 60;
  const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
  const { estimatedDaysLeft, estimatedCompletionDate } = estimateCompletion(entries, settings);

  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    targetHours: settings.targetHours,
    remainingMinutes,
    remainingHours: remainingMinutes / 60,
    percentComplete: targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0,
    estimatedDaysLeft,
    estimatedCompletionDate,
    entryCount: entries.length,
    currentStreak: computeCurrentStreak(entries),
    defaultHoursPerDay: settings.defaultHoursPerDay,
    daysOff: settings.daysOff,
    holidays: settings.holidays,
    timezone: settings.timezone,
  };
}

export function estimateCompletion(
  entries: Pick<EntryDTO, "date" | "hours" | "minutes">[],
  settings: Pick<UserSettingsDTO, "targetHours" | "defaultHoursPerDay" | "daysOff" | "holidays" | "timezone">,
  today = new Date(),
) {
  const todayKey = getDateKeyInTimeZone(today, settings.timezone);
  const targetMinutes = settings.targetHours * 60;
  const defaultDailyMinutes = Math.round(settings.defaultHoursPerDay * 60);

  if (targetMinutes <= 0 || defaultDailyMinutes <= 0) {
    return { estimatedDaysLeft: 0, estimatedCompletionDate: null };
  }

  const futureMinutesByDate = new Map<string, number>();
  let projectedTotalMinutes = 0;

  for (const entry of entries) {
    const entryMinutes = entry.hours * 60 + entry.minutes;
    if (entry.date <= todayKey) {
      projectedTotalMinutes += entryMinutes;
      continue;
    }

    futureMinutesByDate.set(entry.date, (futureMinutesByDate.get(entry.date) ?? 0) + entryMinutes);
  }

  if (projectedTotalMinutes >= targetMinutes) {
    return { estimatedDaysLeft: 0, estimatedCompletionDate: null };
  }

  const holidays = new Set(settings.holidays);
  const cursor = dateKeyToUTCDate(todayKey);
  let estimatedDaysLeft = 0;

  for (let guard = 0; guard < 3650 && projectedTotalMinutes < targetMinutes; guard += 1) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dateKey = utcDateToDateKey(cursor);
    const isSkippedDay =
      settings.daysOff.includes(cursor.getUTCDay()) || holidays.has(dateKey) || isPhHolidayDateKey(dateKey);

    if (isSkippedDay) {
      continue;
    }

    projectedTotalMinutes += futureMinutesByDate.get(dateKey) ?? defaultDailyMinutes;
    estimatedDaysLeft += 1;

    if (projectedTotalMinutes >= targetMinutes) {
      return { estimatedDaysLeft, estimatedCompletionDate: dateKey };
    }
  }

  return { estimatedDaysLeft: 0, estimatedCompletionDate: null };
}
