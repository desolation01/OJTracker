import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { UserSettings } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

const SESSION_USER_CACHE_TTL_MS = 60_000;
type SessionUserCacheEntry = {
  user: SessionUser;
  expiresAt: number;
};
type UserSettingsCacheEntry = {
  settings: UserSettings;
  expiresAt: number;
};

const globalForSessionUserCache = globalThis as unknown as {
  sessionUserCache?: Map<string, SessionUserCacheEntry>;
};
const globalForUserSettingsCache = globalThis as unknown as {
  userSettingsCache?: Map<string, UserSettingsCacheEntry>;
};

const sessionUserCache = globalForSessionUserCache.sessionUserCache ?? new Map<string, SessionUserCacheEntry>();
const userSettingsCache =
  globalForUserSettingsCache.userSettingsCache ?? new Map<string, UserSettingsCacheEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForSessionUserCache.sessionUserCache = sessionUserCache;
  globalForUserSettingsCache.userSettingsCache = userSettingsCache;
}

function getCachedSessionUser(email: string) {
  const cached = sessionUserCache.get(email);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    sessionUserCache.delete(email);
    return null;
  }

  return cached.user;
}

function setCachedSessionUser(user: SessionUser) {
  sessionUserCache.set(user.email, {
    user,
    expiresAt: Date.now() + SESSION_USER_CACHE_TTL_MS,
  });
}

function getCachedUserSettings(userId: string) {
  const cached = userSettingsCache.get(userId);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    userSettingsCache.delete(userId);
    return null;
  }

  return cached.settings;
}

function setCachedUserSettings(settings: UserSettings) {
  userSettingsCache.set(settings.userId, {
    settings,
    expiresAt: Date.now() + SESSION_USER_CACHE_TTL_MS,
  });
}

export function primeUserSettingsCache(settings: UserSettings) {
  setCachedUserSettings(settings);
}

export function invalidateUserSettingsCache(userId?: string) {
  if (!userId) {
    userSettingsCache.clear();
    return;
  }

  userSettingsCache.delete(userId);
}

export async function getSessionUser() {
  const headerStore = headers();
  const headerEmail = headerStore.get("x-oj-user-email")?.trim().toLowerCase();

  let email = headerEmail;
  let metadataName: string | undefined;

  if (!email) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.email) {
      return null;
    }

    email = user.email.toLowerCase();
    metadataName = (user.user_metadata?.name as string | undefined)?.trim();
  }

  const cached = getCachedSessionUser(email);
  if (cached && (!metadataName || metadataName === cached.name)) {
    return cached;
  }

  const localUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true },
  });

  if (localUser) {
    if (metadataName && metadataName !== localUser.name) {
      const updated = await prisma.user.update({
        where: { id: localUser.id },
        data: { name: metadataName },
        select: { id: true, name: true, email: true, role: true },
      });
      setCachedSessionUser(updated);
      return updated;
    }

    setCachedSessionUser(localUser);
    return localUser;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: metadataName || email.split("@")[0] || "OJTracker User",
      settings: {
        create: {},
      },
    },
    select: { id: true, name: true, email: true, role: true },
  });

  setCachedSessionUser(created);
  return created;
}

export async function requireSessionUser() {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireAdminUser() {
  const { user, response } = await requireSessionUser();
  if (!user || response) {
    return { user: null, response };
  }
  if (user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user, response: null };
}

export async function getOrCreateUserSettings(userId: string) {
  const cached = getCachedUserSettings(userId);
  if (cached) {
    return cached;
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  setCachedUserSettings(settings);
  return settings;
}
