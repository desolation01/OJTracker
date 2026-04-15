"use client";

import useSWR, { useSWRConfig } from "swr";

import type { EntryDTO } from "@/types";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import {
  LOCAL_SWR_KEYS,
  bulkCreateLocalEntries,
  deleteLocalEntry,
  getLocalEntries,
  getLocalStats,
  saveLocalEntry,
} from "@/lib/local-pwa-store";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
};

export function useEntries(monthKey: string) {
  const entriesKey = isPwaLocalMode ? LOCAL_SWR_KEYS.entries(monthKey) : `/api/entries?month=${monthKey}`;
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR<{ entries: EntryDTO[] }>(
    entriesKey,
    async () => (isPwaLocalMode ? { entries: getLocalEntries(monthKey) } : fetcher(entriesKey)),
  );

  async function refreshLocalCaches() {
    await Promise.all([
      mutate(entriesKey),
      mutate(LOCAL_SWR_KEYS.stats, getLocalStats(), { revalidate: false }),
      mutate((key) => typeof key === "string" && key.startsWith("local:summary:"), undefined, {
        revalidate: true,
      }),
    ]);
  }

  async function saveEntry(payload: {
    id?: string;
    date: string;
    hours: number;
    minutes: number;
    timeIn?: string;
    timeOut?: string;
    note?: string;
  }) {
    if (isPwaLocalMode) {
      saveLocalEntry(payload);
      await refreshLocalCaches();
      return;
    }

    const isUpdate = Boolean(payload.id);

    await mutate(
      entriesKey,
      async (current: { entries: EntryDTO[] } | undefined) => {
        const response = await fetch(isUpdate ? `/api/entries/${payload.id}` : "/api/entries", {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const payloadError = await response.json().catch(() => ({}));
          throw new Error(payloadError.error ?? "Failed to save entry");
        }

        const { entry } = (await response.json()) as { entry: EntryDTO };

        const existing = current?.entries ?? [];
        const idx = existing.findIndex((e) => e.id === entry.id || e.date === entry.date);
        const updated =
          idx >= 0
            ? [...existing.slice(0, idx), entry, ...existing.slice(idx + 1)]
            : [...existing, entry].sort((a, b) => a.date.localeCompare(b.date));

        return { entries: updated };
      },
      {
        optimisticData: (current: { entries: EntryDTO[] } | undefined) => {
          const existing = current?.entries ?? [];
          const optimistic: EntryDTO = {
            id: payload.id ?? `optimistic-${payload.date}`,
            date: payload.date,
            hours: payload.hours,
            minutes: payload.minutes,
            timeIn: payload.timeIn ?? null,
            timeOut: payload.timeOut ?? null,
            note: payload.note ?? null,
            source: "MANUAL",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const idx = existing.findIndex((e) => e.id === payload.id || e.date === payload.date);
          const updated =
            idx >= 0
              ? [...existing.slice(0, idx), optimistic, ...existing.slice(idx + 1)]
              : [...existing, optimistic].sort((a, b) => a.date.localeCompare(b.date));
          return { entries: updated };
        },
        revalidate: false,
        rollbackOnError: true,
      },
    );

    void mutate("/api/stats");
  }

  async function deleteEntry(id: string) {
    if (isPwaLocalMode) {
      deleteLocalEntry(id);
      await refreshLocalCaches();
      return;
    }

    await mutate(
      entriesKey,
      async (current: { entries: EntryDTO[] } | undefined) => {
        const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const payloadError = await response.json().catch(() => ({}));
          throw new Error(payloadError.error ?? "Failed to delete entry");
        }
        return { entries: (current?.entries ?? []).filter((e) => e.id !== id) };
      },
      {
        optimisticData: (current: { entries: EntryDTO[] } | undefined) => ({
          entries: (current?.entries ?? []).filter((e) => e.id !== id),
        }),
        revalidate: false,
        rollbackOnError: true,
      },
    );

    void mutate("/api/stats");
  }

  async function bulkCreate(startDate: string, endDate: string) {
    if (isPwaLocalMode) {
      const result = bulkCreateLocalEntries({ startDate, endDate });
      await refreshLocalCaches();
      return result;
    }

    const response = await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    if (!response.ok) {
      const payloadError = await response.json().catch(() => ({}));
      throw new Error(payloadError.error ?? "Failed to create bulk entries");
    }

    const result = await response.json();
    void Promise.all([mutate(entriesKey), mutate("/api/stats")]);
    return result as { created: number; skipped: { existing: number; daysOff: number } };
  }

  return {
    entries: data?.entries ?? [],
    isLoading,
    error,
    saveEntry,
    deleteEntry,
    bulkCreate,
  };
}

