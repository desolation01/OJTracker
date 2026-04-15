import { describe, expect, it } from "vitest";

import { bulkEntrySchema, createEntrySchema, updateSettingsSchema } from "@/lib/validators";

describe("validators", () => {
  it("accepts valid create entry payload", () => {
    const parsed = createEntrySchema.safeParse({
      date: "2026-04-13",
      hours: 8,
      minutes: 30,
      timeIn: "08:00",
      timeOut: "16:30",
      note: "Worked on integration",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid bulk range payload", () => {
    const parsed = bulkEntrySchema.safeParse({
      startDate: "2026/04/01",
      endDate: "2026-04-30",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts settings payload with daysOff", () => {
    const parsed = updateSettingsSchema.safeParse({
      targetHours: 700,
      defaultHoursPerDay: 7.5,
      daysOff: [0, 6],
    });
    expect(parsed.success).toBe(true);
  });
});
