import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { toEntryDTO, ENTRY_SELECT } from "@/lib/serializers";
import { monthKeySchema } from "@/lib/validators";
import { dateKeyToUTCDate, addWorkingDays, monthKeyFromDate } from "@/lib/date";
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
    const [entries, settings, totals] = await Promise.all([
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
    ]);

    const totalMinutes = (totals._sum.hours ?? 0) * 60 + (totals._sum.minutes ?? 0);
    const entryCount = totals._count.id;
    const queryCompletedAt = Date.now();
    const targetMinutes = settings.targetHours * 60;
    const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
    const dailyMinutes = Math.round(settings.defaultHoursPerDay * 60);
    const estimatedDaysLeft = dailyMinutes > 0 ? Math.ceil(remainingMinutes / dailyMinutes) : 0;
    const completionDate = addWorkingDays(new Date(), estimatedDaysLeft, settings.daysOff, new Set(settings.holidays));

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
        estimatedCompletionDate: completionDate ? completionDate.toISOString().slice(0, 10) : null,
        entryCount,
        currentStreak: 0,
        defaultHoursPerDay: settings.defaultHoursPerDay,
        daysOff: settings.daysOff,
        holidays: settings.holidays,
      },
    });
  } catch (error) {
    console.error("Dashboard summary GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
