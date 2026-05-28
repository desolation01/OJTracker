import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { utcDateToDateKey } from "@/lib/date";
import { estimateCompletion } from "@/lib/calculations";
import { getOrCreateUserSettings, requireSessionUser } from "@/lib/server";

export const dynamic = "force-dynamic";

function computeCurrentStreakFromWorkedDates(workedDateKeys: Set<string>) {
  let streak = 0;
  const cursor = new Date();

  for (let offset = 0; offset < 3650; offset += 1) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    if (workedDateKeys.has(key)) {
      streak += 1;
      continue;
    }
    if (offset === 0) {
      continue;
    }
    break;
  }

  return streak;
}

export async function GET() {
  try {
    const requestStartedAt = Date.now();
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }
    const authCompletedAt = Date.now();

    const [settings, totals, entries] = await Promise.all([
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
    const queryCompletedAt = Date.now();

    const totalMinutes = (totals._sum.hours ?? 0) * 60 + (totals._sum.minutes ?? 0);
    const targetMinutes = settings.targetHours * 60;
    const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
    const entryDates = entries.map((entry) => ({
      date: utcDateToDateKey(entry.date),
      hours: entry.hours,
      minutes: entry.minutes,
    }));
    const { estimatedDaysLeft, estimatedCompletionDate } = estimateCompletion(entryDates, settings);
    const workedDateKeys = new Set(
      entryDates.filter((entry) => entry.hours * 60 + entry.minutes > 0).map((entry) => entry.date),
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api/stats] auth=${authCompletedAt - requestStartedAt}ms query=${queryCompletedAt - authCompletedAt}ms total=${queryCompletedAt - requestStartedAt}ms`,
      );
    }

    return NextResponse.json({
      totalMinutes,
      totalHours: totalMinutes / 60,
      targetHours: settings.targetHours,
      remainingMinutes,
      remainingHours: remainingMinutes / 60,
      percentComplete: targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0,
      estimatedDaysLeft,
      estimatedCompletionDate,
      entryCount: totals._count.id,
      currentStreak: computeCurrentStreakFromWorkedDates(workedDateKeys),
      defaultHoursPerDay: settings.defaultHoursPerDay,
      daysOff: settings.daysOff,
      holidays: settings.holidays,
      timezone: settings.timezone,
    });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
