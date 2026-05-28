import { describe, expect, it } from "vitest";

import { calculateStats, estimateCompletion } from "@/lib/calculations";
import type { EntryDTO, UserSettingsDTO } from "@/types";

const settings: UserSettingsDTO = {
  targetHours: 600,
  defaultHoursPerDay: 8,
  defaultStartTime: "08:00",
  defaultEndTime: "17:00",
  daysOff: [0, 6],
  holidays: [],
  timezone: "Asia/Manila",
  ojtStartDate: null,
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

function entry(date: string, hours: number, minutes = 0): EntryDTO {
  return {
    id: date,
    date,
    hours,
    minutes,
    timeIn: "08:00",
    timeOut: "17:00",
    note: null,
    source: "MANUAL",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

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

  it("estimates completion dates in the user's timezone", () => {
    const earlyMorningInManila = new Date("2026-04-28T23:30:00.000Z");
    const result = estimateCompletion([entry("2026-04-29", 592)], settings, earlyMorningInManila);

    expect(result.estimatedCompletionDate).toBe("2026-04-30");
  });

  it("uses future working days to estimate completion", () => {
    const result = estimateCompletion(
      [entry("2026-04-30", 592)],
      {
        ...settings,
        daysOff: [0, 5, 6],
      },
      new Date("2026-04-30T04:00:00.000Z"),
    );

    expect(result.estimatedDaysLeft).toBe(1);
    expect(result.estimatedCompletionDate).toBe("2026-05-04");
  });

  it("skips days off and configured holidays when estimating completion", () => {
    const result = estimateCompletion(
      [entry("2026-04-30", 584)],
      {
        ...settings,
        holidays: ["2026-05-04"],
      },
      new Date("2026-04-30T04:00:00.000Z"),
    );

    expect(result.estimatedDaysLeft).toBe(2);
    expect(result.estimatedCompletionDate).toBe("2026-05-06");
  });

  it("skips built-in Philippine holidays when estimating completion", () => {
    const result = estimateCompletion([entry("2026-04-30", 592)], settings, new Date("2026-04-30T04:00:00.000Z"));

    expect(result.estimatedCompletionDate).toBe("2026-05-04");
  });

  it("does not move completion earlier when matching future working days already exist", () => {
    const today = new Date("2026-04-29T04:00:00.000Z");
    const withoutFutureEntries = estimateCompletion([entry("2026-04-29", 576)], settings, today);
    const withFutureEntries = estimateCompletion(
      [entry("2026-04-29", 576), entry("2026-04-30", 8), entry("2026-05-04", 8), entry("2026-05-05", 8)],
      settings,
      today,
    );

    expect(withFutureEntries).toEqual(withoutFutureEntries);
  });
});
