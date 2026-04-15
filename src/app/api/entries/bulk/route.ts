import { NextRequest, NextResponse } from "next/server";
import { eachDayOfInterval } from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { bulkEntrySchema, dateKeySchema } from "@/lib/validators";
import { dateKeyToUTCDate, utcDateToDateKey } from "@/lib/date";
import { decimalHoursToMinutes, minutesToHoursMinutes } from "@/lib/utils";
import { getOrCreateUserSettings, requireSessionUser } from "@/lib/server";

const bulkSelectionSchema = z.union([
  bulkEntrySchema,
  z.object({
    dates: z.array(dateKeySchema).min(1).max(366),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const [{ user, response }, body] = await Promise.all([
      requireSessionUser(),
      req.json(),
    ]);
    if (!user || response) {
      return response;
    }

    const parsed = bulkSelectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const selectedDateKeys =
      "dates" in parsed.data
        ? Array.from(new Set(parsed.data.dates)).sort()
        : (() => {
            const startDate = dateKeyToUTCDate(parsed.data.startDate);
            const endDate = dateKeyToUTCDate(parsed.data.endDate);
            if (endDate < startDate) {
              return [];
            }
            return eachDayOfInterval({ start: startDate, end: endDate }).map(utcDateToDateKey);
          })();

    if (selectedDateKeys.length === 0) {
      return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
    }

    const selectedDates = selectedDateKeys.map(dateKeyToUTCDate);
    const [settings, existingEntries] = await Promise.all([
      getOrCreateUserSettings(user.id),
      prisma.entry.findMany({
        where: { userId: user.id, date: { in: selectedDates } },
        select: { date: true },
      }),
    ]);

    const existingByDate = new Set(existingEntries.map((entry) => utcDateToDateKey(entry.date)));
    const defaultMinutes = decimalHoursToMinutes(settings.defaultHoursPerDay);
    const { hours, minutes } = minutesToHoursMinutes(defaultMinutes);

    let skippedDaysOff = 0;
    let skippedExisting = 0;
    let created = 0;

    const createPayload = selectedDates
      .filter((date) => {
        if (settings.daysOff.includes(date.getUTCDay())) {
          skippedDaysOff += 1;
          return false;
        }

        const key = utcDateToDateKey(date);
        if (existingByDate.has(key)) {
          skippedExisting += 1;
          return false;
        }

        return true;
      })
      .map((date) => ({
        userId: user.id,
        date,
        hours,
        minutes,
        timeIn: settings.defaultStartTime,
        timeOut: settings.defaultEndTime,
        source: "BULK" as const,
      }));

    if (createPayload.length > 0) {
      const result = await prisma.entry.createMany({
        data: createPayload,
        skipDuplicates: true,
      });
      created = result.count;
    }

    return NextResponse.json({
      created,
      skipped: {
        existing: skippedExisting,
        daysOff: skippedDaysOff,
      },
    });
  } catch (error) {
    console.error("Bulk entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
