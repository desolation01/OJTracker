import { addWorkingDays } from "@/lib/date";
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
  const dailyMinutes = Math.round(settings.defaultHoursPerDay * 60);
  const estimatedDaysLeft = dailyMinutes > 0 ? Math.ceil(remainingMinutes / dailyMinutes) : 0;
  const completionDate = addWorkingDays(new Date(), estimatedDaysLeft, settings.daysOff, new Set(settings.holidays));

  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    targetHours: settings.targetHours,
    remainingMinutes,
    remainingHours: remainingMinutes / 60,
    percentComplete: targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0,
    estimatedDaysLeft,
    estimatedCompletionDate: completionDate ? completionDate.toISOString().slice(0, 10) : null,
    entryCount: entries.length,
    currentStreak: computeCurrentStreak(entries),
    defaultHoursPerDay: settings.defaultHoursPerDay,
    daysOff: settings.daysOff,
    holidays: settings.holidays,
  };
}
