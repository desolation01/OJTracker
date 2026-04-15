"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import type { ClockSessionDTO } from "@/types";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import {
  LOCAL_SWR_KEYS,
  clockInLocal,
  clockOutLocal,
  getLocalClockSession,
  getLocalStats,
} from "@/lib/local-pwa-store";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
};

export function useTimeClock() {
  const { mutate: mutateGlobal } = useSWRConfig();
  const key = isPwaLocalMode ? LOCAL_SWR_KEYS.timeclock : "/api/timeclock";
  const { data, isLoading, error, mutate } = useSWR<{ session: ClockSessionDTO | null }>(
    key,
    async () => (isPwaLocalMode ? { session: getLocalClockSession() } : fetcher("/api/timeclock")),
    { refreshInterval: 30_000 },
  );

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!data?.session) {
      return 0;
    }
    const start = new Date(data.session.clockIn).getTime();
    return Math.max(0, Math.floor((now - start) / 1000));
  }, [data?.session, now]);

  const clockIn = useCallback(async () => {
    if (isPwaLocalMode) {
      const result = clockInLocal();
      await Promise.all([
        mutate({ session: result.session }, { revalidate: false }),
        mutateGlobal(LOCAL_SWR_KEYS.stats, getLocalStats(), { revalidate: false }),
        mutateGlobal((swrKey) => typeof swrKey === "string" && swrKey.startsWith("local:summary:"), undefined, {
          revalidate: true,
        }),
      ]);
      return;
    }

    const optimisticClockIn = new Date().toISOString();
    const optimisticDate = new Date().toISOString().slice(0, 10);

    await mutate(
      { session: { id: "optimistic", clockIn: optimisticClockIn, date: optimisticDate } },
      { revalidate: false },
    );

    try {
      const response = await fetch("/api/timeclock", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to clock in");
      }
      void mutate();
      void mutateGlobal("/api/stats");
    } catch (err) {
      await mutate({ session: null }, { revalidate: true });
      throw err;
    }
  }, [mutate, mutateGlobal]);

  const clockOut = useCallback(async () => {
    if (isPwaLocalMode) {
      const result = clockOutLocal();
      await Promise.all([
        mutate({ session: null }, { revalidate: false }),
        mutateGlobal(LOCAL_SWR_KEYS.stats, getLocalStats(), { revalidate: false }),
        mutateGlobal((swrKey) => typeof swrKey === "string" && swrKey.startsWith("local:summary:"), undefined, {
          revalidate: true,
        }),
      ]);
      return result;
    }

    await mutate({ session: null }, { revalidate: false });

    try {
      const response = await fetch("/api/timeclock/out", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to clock out");
      }
      const result = await response.json();
      void mutate();
      void mutateGlobal("/api/stats");
      return result;
    } catch (err) {
      await mutate(undefined, { revalidate: true });
      throw err;
    }
  }, [mutate, mutateGlobal]);

  return {
    session: data?.session ?? null,
    isLoading,
    error,
    elapsedSeconds,
    clockIn,
    clockOut,
  };
}

