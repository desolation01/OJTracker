"use client";

import useSWR from "swr";
import { useSWRConfig } from "swr";

import type { UserSettingsDTO } from "@/types";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import { LOCAL_SWR_KEYS, getLocalSettings, getLocalStats, updateLocalSettings } from "@/lib/local-pwa-store";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
};

export function useSettings() {
  const { mutate: mutateGlobal } = useSWRConfig();
  const settingsKey = isPwaLocalMode ? LOCAL_SWR_KEYS.settings : "/api/settings";
  const { data, isLoading, error, mutate } = useSWR<{ settings: UserSettingsDTO }>(
    settingsKey,
    async () => (isPwaLocalMode ? { settings: getLocalSettings() } : fetcher("/api/settings")),
  );

  async function updateSettings(payload: Partial<UserSettingsDTO>) {
    if (isPwaLocalMode) {
      const settings = updateLocalSettings(payload);
      await Promise.all([
        mutate({ settings }, { revalidate: false }),
        mutateGlobal(LOCAL_SWR_KEYS.stats, getLocalStats(), { revalidate: false }),
        mutateGlobal(
          (key) => typeof key === "string" && key.startsWith("local:summary:"),
          undefined,
          { revalidate: true },
        ),
      ]);
      return { settings };
    }

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error ?? "Failed to update settings");
    }

    await Promise.all([mutate(), mutateGlobal("/api/stats"), mutateGlobal((key: string) => typeof key === "string" && key.startsWith("/api/dashboard/summary"))]);
    return response.json();
  }

  return {
    settings: data?.settings,
    isLoading,
    error,
    updateSettings,
  };
}
