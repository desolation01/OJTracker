import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";

import { prisma } from "@/lib/prisma";
import { toEntryDTO, ENTRY_SELECT } from "@/lib/serializers";
import { createEntrySchema, monthKeySchema } from "@/lib/validators";
import { dateKeyToUTCDate, monthKeyFromDate } from "@/lib/date";
import { requireSessionUser } from "@/lib/server";

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

    const entries = await prisma.entry.findMany({
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
    });
    const queryCompletedAt = Date.now();

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api/entries] month=${parsedMonth.data} auth=${authCompletedAt - requestStartedAt}ms query=${queryCompletedAt - authCompletedAt}ms total=${queryCompletedAt - requestStartedAt}ms`,
      );
    }

    return NextResponse.json({
      entries: entries.map(toEntryDTO),
    });
  } catch (error) {
    console.error("Entries GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const [{ user, response }, body] = await Promise.all([requireSessionUser(), req.json()]);
    if (!user || response) {
      return response;
    }

    const parsed = createEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    const date = dateKeyToUTCDate(payload.date);

    const entry = await prisma.entry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      update: {
        hours: payload.hours,
        minutes: payload.minutes,
        timeIn: payload.timeIn || null,
        timeOut: payload.timeOut || null,
        note: payload.note || null,
      },
      create: {
        userId: user.id,
        date,
        hours: payload.hours,
        minutes: payload.minutes,
        timeIn: payload.timeIn || null,
        timeOut: payload.timeOut || null,
        note: payload.note || null,
        source: "MANUAL",
      },
    });

    return NextResponse.json({ entry: toEntryDTO(entry) }, { status: 201 });
  } catch (error) {
    console.error("Entries POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
