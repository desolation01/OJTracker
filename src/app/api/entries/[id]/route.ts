import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toEntryDTO, ENTRY_SELECT } from "@/lib/serializers";
import { updateEntrySchema } from "@/lib/validators";
import { requireSessionUser } from "@/lib/server";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }

    const entry = await prisma.entry.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      select: ENTRY_SELECT,
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry: toEntryDTO(entry) });
  } catch (error) {
    console.error("Entry GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const [{ user, response }, body] = await Promise.all([
      requireSessionUser(),
      req.json(),
    ]);
    if (!user || response) {
      return response;
    }

    const parsed = updateEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Batch updateMany + findUnique into a single transaction round trip
    const updateData = {
      ...(parsed.data.hours !== undefined && { hours: parsed.data.hours }),
      ...(parsed.data.minutes !== undefined && { minutes: parsed.data.minutes }),
      ...(parsed.data.timeIn !== undefined && { timeIn: parsed.data.timeIn || null }),
      ...(parsed.data.timeOut !== undefined && { timeOut: parsed.data.timeOut || null }),
      ...(parsed.data.note !== undefined && { note: parsed.data.note || null }),
    };

    const [result, entry] = await prisma.$transaction([
      prisma.entry.updateMany({
        where: { id: params.id, userId: user.id },
        data: updateData,
      }),
      prisma.entry.findUnique({ where: { id: params.id }, select: ENTRY_SELECT }),
    ]);

    if (result.count === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry: toEntryDTO(entry!) });
  } catch (error) {
    console.error("Entry PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const requestStartedAt = Date.now();
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }
    const authCompletedAt = Date.now();

    const deleted = await prisma.entry.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    });
    const queryCompletedAt = Date.now();

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[api/entries/delete] id=${params.id} auth=${authCompletedAt - requestStartedAt}ms query=${queryCompletedAt - authCompletedAt}ms total=${queryCompletedAt - requestStartedAt}ms`,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Entry DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
