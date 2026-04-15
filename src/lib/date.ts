import {
  addDays,
  endOfMonth,
  format,
  parse,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

export function getTimeKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function dateKeyToUTCDate(dateKey: string) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`Invalid date key: ${dateKey}`);
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcDateToDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function localDateToDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function monthKeyToInterval(monthKey: string) {
  const parsed = parse(`${monthKey}-01`, "yyyy-MM-dd", new Date());
  const start = startOfMonth(parsed);
  const end = endOfMonth(parsed);
  return { start, end };
}

export function getMonthGridDates(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function addWorkingDays(startDate: Date, amount: number, daysOff: number[], holidays?: Set<string>) {
  if (amount <= 0) {
    return null;
  }

  let count = 0;
  let cursor = new Date(startDate);
  while (count < amount) {
    cursor = addDays(cursor, 1);
    const key = cursor.toISOString().slice(0, 10);
    if (!daysOff.includes(cursor.getDay()) && !holidays?.has(key)) {
      count += 1;
    }
  }
  return cursor;
}

export function monthKeyFromDate(date: Date) {
  return format(date, "yyyy-MM");
}
