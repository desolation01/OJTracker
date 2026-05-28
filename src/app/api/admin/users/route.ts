import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { utcDateToDateKey } from "@/lib/date";
import { estimateCompletion } from "@/lib/calculations";
import { isPhHoliday } from "@/lib/ph-holidays";
import { requireAdminUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user: admin, response } = await requireAdminUser();
    if (!admin || response) {
      return response;
    }

    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        settings: {
          select: {
            targetHours: true,
            defaultHoursPerDay: true,
            daysOff: true,
            holidays: true,
            timezone: true,
            ojtStartDate: true,
          },
        },
        entries: {
          select: {
            date: true,
            hours: true,
            minutes: true,
          },
          orderBy: { date: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const ojts = users.map((u) => {
      const settings = u.settings;
      const targetHours = settings?.targetHours ?? 600;
      const defaultHoursPerDay = settings?.defaultHoursPerDay ?? 8;
      const daysOff = settings?.daysOff ?? [0, 6];

      const totalMinutes = u.entries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0);
      const totalHours = totalMinutes / 60;
      const targetMinutes = targetHours * 60;
      const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
      const remainingHours = remainingMinutes / 60;
      const percentComplete = targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0;

      // Days attended = unique dates with entries
      const daysAttended = u.entries.length;

      // Build lookup sets for O(1) checks
      const entryDates = new Set(u.entries.map((e) => utcDateToDateKey(e.date)));
      const userHolidays = new Set(settings?.holidays ?? []);

      // Start from ojtStartDate if set, otherwise fall back to account creation date
      const startDate = settings?.ojtStartDate ?? u.createdAt;
      const cursor = new Date(startDate);
      cursor.setUTCHours(0, 0, 0, 0);

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      let absences = 0;
      while (cursor <= today) {
        const dayOfWeek = cursor.getUTCDay();
        const dateKey = utcDateToDateKey(cursor);
        const isDayOff = daysOff.includes(dayOfWeek);
        const isHoliday = userHolidays.has(dateKey) || isPhHoliday(cursor);

        if (!isDayOff && !isHoliday && !entryDates.has(dateKey)) {
          absences++;
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }

      const { estimatedDaysLeft, estimatedCompletionDate } = estimateCompletion(
        u.entries.map((entry) => ({
          date: utcDateToDateKey(entry.date),
          hours: entry.hours,
          minutes: entry.minutes,
        })),
        {
          targetHours,
          defaultHoursPerDay,
          daysOff,
          holidays: settings?.holidays ?? [],
          timezone: settings?.timezone ?? "Asia/Manila",
        },
      );

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        daysAttended,
        absences,
        totalHours: Math.round(totalHours * 100) / 100,
        targetHours,
        remainingHours: Math.round(remainingHours * 100) / 100,
        percentComplete: Math.round(percentComplete * 10) / 10,
        estimatedDaysLeft,
        estimatedCompletionDate,
      };
    });

    return NextResponse.json({ users: ojts });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
