import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { dateKeyToUTCDate } from "@/lib/date";
import {
  getOrCreateUserSettings,
  invalidateUserSettingsCache,
  primeUserSettingsCache,
  requireSessionUser,
} from "@/lib/server";
import { updateSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

function serializeSettings(settings: { ojtStartDate: Date | null; [key: string]: unknown }) {
  return {
    ...settings,
    ojtStartDate: settings.ojtStartDate
      ? (settings.ojtStartDate as Date).toISOString().slice(0, 10)
      : null,
  };
}

export async function GET() {
  try {
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }

    const settings = await getOrCreateUserSettings(user.id);
    return NextResponse.json({ settings: serializeSettings(settings) });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, response } = await requireSessionUser();
    if (!user || response) {
      return response;
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { ojtStartDate, ...rest } = parsed.data;
    const prismaData = {
      ...rest,
      ojtStartDate: ojtStartDate ? dateKeyToUTCDate(ojtStartDate) : ojtStartDate ?? undefined,
    };

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: prismaData,
      create: {
        userId: user.id,
        ...prismaData,
      },
    });

    invalidateUserSettingsCache(user.id);
    primeUserSettingsCache(settings);

    return NextResponse.json({ settings: serializeSettings(settings) });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
