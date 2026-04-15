import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getDateKeyInTimeZone, dateKeyToUTCDate, utcDateToDateKey } from "@/lib/date";
import { getOrCreateUserSettings, requireSessionUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }

    const activeSession = await prisma.clockSession.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
      orderBy: {
        clockIn: "desc",
      },
    });

    return NextResponse.json({
      session: activeSession
        ? {
            id: activeSession.id,
            clockIn: activeSession.clockIn.toISOString(),
            date: utcDateToDateKey(activeSession.date),
          }
        : null,
    });
  } catch (error) {
    console.error("Timeclock GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }

    const existing = await prisma.clockSession.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "You already have an active session." }, { status: 409 });
    }

    const settings = await getOrCreateUserSettings(user.id);
    const now = new Date();
    const dateKey = getDateKeyInTimeZone(now, settings.timezone);
    const date = dateKeyToUTCDate(dateKey);

    const session = await prisma.clockSession.create({
      data: {
        userId: user.id,
        clockIn: now,
        date,
      },
    });

    return NextResponse.json(
      {
        session: {
          id: session.id,
          clockIn: session.clockIn.toISOString(),
          date: utcDateToDateKey(session.date),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Timeclock POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
