import { describe, expect, it } from "vitest";

import { calculateStats } from "@/lib/calculations";
import type { EntryDTO, UserSettingsDTO } from "@/types";

const settings: UserSettingsDTO = {
  targetHours: 600,
  defaultHoursPerDay: 8,
  defaultStartTime: "08:00",
  defaultEndTime: "17:00",
  daysOff: [0, 6],
  holidays: [],
  timezone: "Asia/Manila",
};

const entries: EntryDTO[] = [
  {
    id: "1",
    date: "2026-04-01",
    hours: 8,
    minutes: 0,
    timeIn: "08:00",
    timeOut: "17:00",
    note: null,
    source: "MANUAL",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    date: "2026-04-02",
    hours: 7,
    minutes: 30,
    timeIn: "08:00",
    timeOut: "16:30",
    note: null,
    source: "BULK",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("calculateStats", () => {
  it("computes totals and remaining values correctly", () => {
    const result = calculateStats(entries, settings);
    expect(result.totalMinutes).toBe(930);
    expect(result.totalHours).toBe(15.5);
    expect(result.remainingMinutes).toBe(35070);
    expect(result.remainingHours).toBe(584.5);
    expect(result.percentComplete).toBeCloseTo(2.58, 1);
  });

  it("caps percentage at 100", () => {
    const highEntries: EntryDTO[] = [
      {
        ...entries[0],
        id: "big",
        hours: 700,
        minutes: 0,
      },
    ];
    const result = calculateStats(highEntries, settings);
    expect(result.percentComplete).toBe(100);
    expect(result.remainingMinutes).toBe(0);
  });
});
