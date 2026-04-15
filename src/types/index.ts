import type { EntrySource } from "@prisma/client";

export interface EntryDTO {
  id: string;
  date: string;
  hours: number;
  minutes: number;
  timeIn: string | null;
  timeOut: string | null;
  note: string | null;
  source: EntrySource;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsDTO {
  targetHours: number;
  defaultHoursPerDay: number;
  defaultStartTime: string;
  defaultEndTime: string;
  daysOff: number[];
  holidays: string[];
  timezone: string;
  ojtStartDate: string | null;
}

export interface ClockSessionDTO {
  id: string;
  clockIn: string;
  date: string;
}
