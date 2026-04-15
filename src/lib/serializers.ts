import type { Prisma } from "@prisma/client";
import type { EntrySource } from "@prisma/client";

import { utcDateToDateKey } from "@/lib/date";
import type { EntryDTO } from "@/types";

export const ENTRY_SELECT: Prisma.EntrySelect = {
  id: true,
  date: true,
  hours: true,
  minutes: true,
  timeIn: true,
  timeOut: true,
  note: true,
  source: true,
  createdAt: true,
  updatedAt: true,
};

type EntrySelected = {
  id: string;
  date: Date;
  hours: number;
  minutes: number;
  timeIn: string | null;
  timeOut: string | null;
  note: string | null;
  source: EntrySource;
  createdAt: Date;
  updatedAt: Date;
};

export function toEntryDTO(entry: EntrySelected): EntryDTO {
  return {
    id: entry.id,
    date: utcDateToDateKey(entry.date),
    hours: entry.hours,
    minutes: entry.minutes,
    timeIn: entry.timeIn,
    timeOut: entry.timeOut,
    note: entry.note,
    source: entry.source,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
