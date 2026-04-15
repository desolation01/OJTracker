"use client";

import useSWR from "swr";
import type { StatsResult } from "@/lib/calculations";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import { LOCAL_SWR_KEYS, getLocalStats } from "@/lib/local-pwa-store";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
};

export function useStats() {
  const key = isPwaLocalMode ? LOCAL_SWR_KEYS.stats : "/api/stats";
  const { data, isLoading, error, mutate } = useSWR<StatsResult>(
    key,
    async () => (isPwaLocalMode ? getLocalStats() : fetcher("/api/stats")),
  );
  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
