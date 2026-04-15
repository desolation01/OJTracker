import type { EntryDTO, UserSettingsDTO, ClockSessionDTO } from "@/types";
import { calculateStats } from "@/lib/calculations";
import {
  dateKeyToUTCDate,
  getDateKeyInTimeZone,
  getTimeKeyInTimeZone,
  monthKeyFromDate,
  utcDateToDateKey,
} from "@/lib/date";
import { decimalHoursToMinutes, minutesToHoursMinutes } from "@/lib/utils";

const STORAGE_KEYS = {
  entries: "ojtracker:pwa:entries",
  settings: "ojtracker:pwa:settings",
  session: "ojtracker:pwa:active-session",
} as const;

export const LOCAL_SWR_KEYS = {
  settings: "local:settings",
  stats: "local:stats",
  timeclock: "local:timeclock",
  entries: (monthKey: string) => `local:entries:${monthKey}`,
  summary: (monthKey: string) => `local:summary:${monthKey}`,
} as const;

const DEFAULT_SETTINGS: UserSettingsDTO = {
  targetHours: 600,
  defaultHoursPerDay: 8,
  defaultStartTime: "08:00",
  defaultEndTime: "17:00",
  daysOff: [0, 6],
  holidays: [],
  timezone: "Asia/Manila",
  ojtStartDate: null,
};

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function getEntriesStore() {
  const storage = getStorage();
  if (!storage) {
    return [] as EntryDTO[];
  }

  const entries = safeJsonParse<EntryDTO[]>(storage.getItem(STORAGE_KEYS.entries), []);
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function setEntriesStore(entries: EntryDTO[]) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEYS.entries, JSON.stringify([...entries].sort((a, b) => a.date.localeCompare(b.date))));
}

export function getLocalSettings(): UserSettingsDTO {
  const storage = getStorage();
  if (!storage) {
    return DEFAULT_SETTINGS;
  }

  const stored = safeJsonParse<Partial<UserSettingsDTO>>(storage.getItem(STORAGE_KEYS.settings), {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    daysOff: Array.isArray(stored.daysOff) ? stored.daysOff : DEFAULT_SETTINGS.daysOff,
    holidays: Array.isArray(stored.holidays) ? stored.holidays : DEFAULT_SETTINGS.holidays,
    ojtStartDate: stored.ojtStartDate ?? DEFAULT_SETTINGS.ojtStartDate,
  };
}

export function updateLocalSettings(payload: Partial<UserSettingsDTO>): UserSettingsDTO {
  const storage = getStorage();
  const current = getLocalSettings();
  const next = {
    ...current,
    ...payload,
    daysOff: payload.daysOff ?? current.daysOff,
    holidays: payload.holidays ?? current.holidays,
  };

  if (storage) {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
  }

  return next;
}

export function getLocalClockSession(): ClockSessionDTO | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return safeJsonParse<ClockSessionDTO | null>(storage.getItem(STORAGE_KEYS.session), null);
}

function setLocalClockSession(session: ClockSessionDTO | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (!session) {
    storage.removeItem(STORAGE_KEYS.session);
    return;
  }

  storage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function getLocalEntries(monthKey?: string): EntryDTO[] {
  const entries = getEntriesStore();
  if (!monthKey) {
    return entries;
  }
  return entries.filter((entry) => entry.date.startsWith(monthKey));
}

export function saveLocalEntry(payload: {
  id?: string;
  date: string;
  hours: number;
  minutes: number;
  timeIn?: string;
  timeOut?: string;
  note?: string;
}): EntryDTO {
  const entries = getEntriesStore();
  const now = new Date().toISOString();
  const index = payload.id
    ? entries.findIndex((entry) => entry.id === payload.id)
    : entries.findIndex((entry) => entry.date === payload.date);

  if (index >= 0) {
    const current = entries[index];
    const updated: EntryDTO = {
      ...current,
      hours: payload.hours,
      minutes: payload.minutes,
      timeIn: payload.timeIn ?? null,
      timeOut: payload.timeOut ?? null,
      note: payload.note ?? null,
      updatedAt: now,
    };
    entries[index] = updated;
    setEntriesStore(entries);
    return updated;
  }

  const created: EntryDTO = {
    id: newId("entry"),
    date: payload.date,
    hours: payload.hours,
    minutes: payload.minutes,
    timeIn: payload.timeIn ?? null,
    timeOut: payload.timeOut ?? null,
    note: payload.note ?? null,
    source: "MANUAL",
    createdAt: now,
    updatedAt: now,
  };

  entries.push(created);
  setEntriesStore(entries);
  return created;
}

export function deleteLocalEntry(id: string) {
  const entries = getEntriesStore();
  const next = entries.filter((entry) => entry.id !== id);
  setEntriesStore(next);
}

function getDateKeysFromPayload(payload: { startDate: string; endDate: string } | { dates: string[] }) {
  if ("dates" in payload) {
    return Array.from(new Set(payload.dates)).sort();
  }

  const start = dateKeyToUTCDate(payload.startDate);
  const end = dateKeyToUTCDate(payload.endDate);
  if (end < start) {
    return [] as string[];
  }

  const dateKeys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dateKeys.push(utcDateToDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dateKeys;
}

export function bulkCreateLocalEntries(payload: { startDate: string; endDate: string } | { dates: string[] }) {
  const settings = getLocalSettings();
  const entries = getEntriesStore();
  const existing = new Set(entries.map((entry) => entry.date));
  const defaultMinutes = decimalHoursToMinutes(settings.defaultHoursPerDay);
  const { hours, minutes } = minutesToHoursMinutes(defaultMinutes);
  const now = new Date().toISOString();

  const dateKeys = getDateKeysFromPayload(payload);
  if (dateKeys.length === 0) {
    throw new Error("endDate must be after startDate");
  }

  let skippedExisting = 0;
  let skippedDaysOff = 0;
  let created = 0;

  for (const dateKey of dateKeys) {
    const date = dateKeyToUTCDate(dateKey);
    if (settings.daysOff.includes(date.getUTCDay())) {
      skippedDaysOff += 1;
      continue;
    }

    if (existing.has(dateKey)) {
      skippedExisting += 1;
      continue;
    }

    entries.push({
      id: newId("entry"),
      date: dateKey,
      hours,
      minutes,
      timeIn: settings.defaultStartTime,
      timeOut: settings.defaultEndTime,
      note: null,
      source: "BULK",
      createdAt: now,
      updatedAt: now,
    });
    existing.add(dateKey);
    created += 1;
  }

  setEntriesStore(entries);
  return {
    created,
    skipped: {
      existing: skippedExisting,
      daysOff: skippedDaysOff,
    },
  };
}

export function bulkDeleteLocalEntries(payload: { startDate: string; endDate: string } | { dates: string[] }) {
  const dateKeys = new Set(getDateKeysFromPayload(payload));
  if (dateKeys.size === 0) {
    throw new Error("endDate must be after startDate");
  }

  const entries = getEntriesStore();
  const next = entries.filter((entry) => !dateKeys.has(entry.date));
  const deleted = entries.length - next.length;
  setEntriesStore(next);
  return { deleted };
}

export function getLocalStats() {
  return calculateStats(getLocalEntries(), getLocalSettings());
}

export function getLocalDashboardSummary(monthKey: string) {
  return {
    entries: getLocalEntries(monthKey),
    stats: getLocalStats(),
  };
}

export function clockInLocal() {
  if (getLocalClockSession()) {
    throw new Error("You already have an active session.");
  }

  const settings = getLocalSettings();
  const now = new Date();
  const session: ClockSessionDTO = {
    id: newId("session"),
    clockIn: now.toISOString(),
    date: getDateKeyInTimeZone(now, settings.timezone),
  };

  setLocalClockSession(session);
  return { session };
}

export function clockOutLocal() {
  const active = getLocalClockSession();
  if (!active) {
    throw new Error("No active clock session found.");
  }

  const settings = getLocalSettings();
  const now = new Date();
  const startedAt = new Date(active.clockIn);
  const elapsedMinutes = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  const entries = getEntriesStore();
  const index = entries.findIndex((entry) => entry.date === active.date);
  const existing = index >= 0 ? entries[index] : null;
  const previousMinutes = existing ? existing.hours * 60 + existing.minutes : 0;
  const { hours, minutes } = minutesToHoursMinutes(previousMinutes + elapsedMinutes);
  const timestamp = now.toISOString();

  const nextEntry: EntryDTO = existing
    ? {
        ...existing,
        hours,
        minutes,
        timeIn: existing.timeIn ?? getTimeKeyInTimeZone(startedAt, settings.timezone),
        timeOut: getTimeKeyInTimeZone(now, settings.timezone),
        updatedAt: timestamp,
      }
    : {
        id: newId("entry"),
        date: active.date,
        hours,
        minutes,
        timeIn: getTimeKeyInTimeZone(startedAt, settings.timezone),
        timeOut: getTimeKeyInTimeZone(now, settings.timezone),
        note: null,
        source: "TIMECLOCK",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

  if (index >= 0) {
    entries[index] = nextEntry;
  } else {
    entries.push(nextEntry);
  }

  setEntriesStore(entries);
  setLocalClockSession(null);

  return {
    sessionDate: active.date,
    elapsedMinutes,
    entry: nextEntry,
  };
}

export function getLocalMonthKey() {
  return monthKeyFromDate(new Date());
}
