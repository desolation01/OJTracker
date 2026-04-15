import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { bulkEntrySchema, dateKeySchema } from "@/lib/validators";
import { dateKeyToUTCDate } from "@/lib/date";
import { requireSessionUser } from "@/lib/server";

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

    if ("dates" in parsed.data) {
      const selectedDates = Array.from(new Set(parsed.data.dates)).map(dateKeyToUTCDate);
      const deleted = await prisma.entry.deleteMany({
        where: {
          userId: user.id,
          date: {
            in: selectedDates,
          },
        },
      });

      return NextResponse.json({ deleted: deleted.count });
    }

    const startDate = dateKeyToUTCDate(parsed.data.startDate);
    const endDate = dateKeyToUTCDate(parsed.data.endDate);

    if (endDate < startDate) {
      return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
    }

    const deleted = await prisma.entry.deleteMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return NextResponse.json({ deleted: deleted.count });
  } catch (error) {
    console.error("Bulk delete entries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
