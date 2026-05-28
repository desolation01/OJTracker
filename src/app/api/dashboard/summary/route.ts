import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { toEntryDTO, ENTRY_SELECT } from "@/lib/serializers";
import { monthKeySchema } from "@/lib/validators";
import { dateKeyToUTCDate, monthKeyFromDate, utcDateToDateKey } from "@/lib/date";
import { estimateCompletion } from "@/lib/calculations";
import { getOrCreateUserSettings, requireSessionUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const requestStartedAt = Date.now();
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }
    const authCompletedAt = Date.now();

    const monthRaw = req.nextUrl.searchParams.get("month");
    const month = monthRaw ?? monthKeyFromDate(new Date());
    const parsedMonth = monthKeySchema.safeParse(month);
    if (!parsedMonth.success) {
      return NextResponse.json({ error: "Invalid month format. Use YYYY-MM." }, { status: 400 });
    }

    const start = dateKeyToUTCDate(`${parsedMonth.data}-01`);
    const end = addMonths(start, 1);

    // Month-filtered entries for calendar display
    // All-time aggregate for stats (progress, remaining, estimated end date)
    const [entries, settings, totals, allEntryDates] = await Promise.all([
      prisma.entry.findMany({
        where: {
          userId: user.id,
          date: {
            gte: start,
            lt: end,
          },
        },
        select: ENTRY_SELECT,
        orderBy: {
          date: "asc",
        },
      }),
      getOrCreateUserSettings(user.id),
      prisma.entry.aggregate({
        where: { userId: user.id },
        _sum: {
          hours: true,
          minutes: true,
        },
        _count: {
          id: true,
        },
      }),
      prisma.entry.findMany({
        where: { userId: user.id },
        select: {
          date: true,
          hours: true,
          minutes: true,
        },
      }),
    ]);

    const totalMinutes = (totals._sum.hours ?? 0) * 60 + (totals._sum.minutes ?? 0);
    const entryCount = totals._count.id;
    const queryCompletedAt = Date.now();
    const targetMinutes = settings.targetHours * 60;
    const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
    const { estimatedDaysLeft, estimatedCompletionDate } = estimateCompletion(
      allEntryDates.map((entry) => ({
        date: utcDateToDateKey(entry.date),
        hours: entry.hours,
        minutes: entry.minutes,
      })),
      settings,
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api/dashboard/summary] month=${parsedMonth.data} auth=${authCompletedAt - requestStartedAt}ms query=${queryCompletedAt - authCompletedAt}ms total=${queryCompletedAt - requestStartedAt}ms`,
      );
    }

    return NextResponse.json({
      entries: entries.map(toEntryDTO),
      stats: {
        totalMinutes,
        totalHours: totalMinutes / 60,
        targetHours: settings.targetHours,
        remainingMinutes,
        remainingHours: remainingMinutes / 60,
        percentComplete: targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0,
        estimatedDaysLeft,
        estimatedCompletionDate,
        entryCount,
        currentStreak: 0,
        defaultHoursPerDay: settings.defaultHoursPerDay,
        daysOff: settings.daysOff,
        holidays: settings.holidays,
        timezone: settings.timezone,
      },
    });
  } catch (error) {
    console.error("Dashboard summary GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
