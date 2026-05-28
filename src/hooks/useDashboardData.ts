"use client";

import useSWR, { useSWRConfig } from "swr";

import type { EntryDTO } from "@/types";
import { estimateCompletion, type StatsResult } from "@/lib/calculations";
import { isPwaLocalMode } from "@/lib/pwa-mode";
import {
  LOCAL_SWR_KEYS,
  bulkCreateLocalEntries,
  bulkDeleteLocalEntries,
  deleteLocalEntry,
  getLocalDashboardSummary,
  getLocalEntries,
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

interface DashboardSummaryResponse {
  entries: EntryDTO[];
  stats: StatsResult;
}

function applyStatsDelta(
  stats: StatsResult,
  entries: EntryDTO[],
  deltaMinutes: number,
  deltaCount: number,
): StatsResult {
  const totalMinutes = stats.totalMinutes + deltaMinutes;
  const targetMinutes = stats.targetHours * 60;
  const remainingMinutes = Math.max(0, targetMinutes - totalMinutes);
  const { estimatedDaysLeft, estimatedCompletionDate } = estimateCompletion(entries, stats);
  return {
    ...stats,
    totalMinutes,
    totalHours: totalMinutes / 60,
    remainingMinutes,
    remainingHours: remainingMinutes / 60,
    percentComplete: targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0,
    entryCount: stats.entryCount + deltaCount,
    estimatedDaysLeft,
    estimatedCompletionDate,
  };
}

export function useDashboardData(monthKey: string) {
  const summaryKey = isPwaLocalMode ? LOCAL_SWR_KEYS.summary(monthKey) : `/api/dashboard/summary?month=${monthKey}`;
  const entriesKey = isPwaLocalMode ? LOCAL_SWR_KEYS.entries(monthKey) : `/api/entries?month=${monthKey}`;
  const { mutate } = useSWRConfig();
  const { data, error, isLoading } = useSWR<DashboardSummaryResponse>(
    summaryKey,
    async () => (isPwaLocalMode ? getLocalDashboardSummary(monthKey) : fetcher(summaryKey)),
  );

  async function refreshLocalCaches() {
    await Promise.all([
      mutate(summaryKey),
      mutate(entriesKey, { entries: getLocalEntries(monthKey) }, { revalidate: false }),
      mutate(LOCAL_SWR_KEYS.stats, undefined, { revalidate: true }),
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
      summaryKey,
      async (current: DashboardSummaryResponse | undefined) => {
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
        const updatedEntries =
          idx >= 0
            ? [...existing.slice(0, idx), entry, ...existing.slice(idx + 1)]
            : [...existing, entry].sort((a, b) => a.date.localeCompare(b.date));

        const oldEntry = idx >= 0 ? existing[idx] : null;
        const oldMinutes = oldEntry ? oldEntry.hours * 60 + oldEntry.minutes : 0;
        const newMinutes = entry.hours * 60 + entry.minutes;
        const deltaMinutes = newMinutes - oldMinutes;
        const deltaCount = idx < 0 ? 1 : 0;

        const stats = current?.stats;
        return {
          entries: updatedEntries,
          stats: stats ? applyStatsDelta(stats, updatedEntries, deltaMinutes, deltaCount) : stats!,
        };
      },
      {
        optimisticData: (current: DashboardSummaryResponse | undefined) => {
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
          const updatedEntries =
            idx >= 0
              ? [...existing.slice(0, idx), optimistic, ...existing.slice(idx + 1)]
              : [...existing, optimistic].sort((a, b) => a.date.localeCompare(b.date));

          const oldEntry = idx >= 0 ? existing[idx] : null;
          const oldMinutes = oldEntry ? oldEntry.hours * 60 + oldEntry.minutes : 0;
          const newMinutes = payload.hours * 60 + payload.minutes;
          const deltaMinutes = newMinutes - oldMinutes;
          const deltaCount = idx < 0 ? 1 : 0;

          const stats = current?.stats;
          return {
            entries: updatedEntries,
            stats: stats ? applyStatsDelta(stats, updatedEntries, deltaMinutes, deltaCount) : stats!,
          };
        },
        revalidate: false,
        rollbackOnError: true,
      },
    );
  }

  async function deleteEntry(id: string) {
    if (isPwaLocalMode) {
      deleteLocalEntry(id);
      await refreshLocalCaches();
      return;
    }

    await mutate(
      summaryKey,
      async (current: DashboardSummaryResponse | undefined) => {
        const response = await fetch(`/api/entries/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const payloadError = await response.json().catch(() => ({}));
          throw new Error(payloadError.error ?? "Failed to delete entry");
        }

        const existing = current?.entries ?? [];
        const entry = existing.find((e) => e.id === id);
        const updatedEntries = existing.filter((e) => e.id !== id);

        const stats = current?.stats;
        if (!stats || !entry) return { entries: updatedEntries, stats: stats! };

        const deltaMinutes = -(entry.hours * 60 + entry.minutes);
        return {
          entries: updatedEntries,
          stats: applyStatsDelta(stats, updatedEntries, deltaMinutes, -1),
        };
      },
      {
        optimisticData: (current: DashboardSummaryResponse | undefined) => {
          const existing = current?.entries ?? [];
          const entry = existing.find((e) => e.id === id);
          const updatedEntries = existing.filter((e) => e.id !== id);

          const stats = current?.stats;
          if (!stats || !entry) return { entries: updatedEntries, stats: stats! };

          const deltaMinutes = -(entry.hours * 60 + entry.minutes);
          return {
            entries: updatedEntries,
            stats: applyStatsDelta(stats, updatedEntries, deltaMinutes, -1),
          };
        },
        revalidate: false,
        rollbackOnError: true,
      },
    );
  }

  async function bulkCreate(payload: { startDate: string; endDate: string } | { dates: string[] }) {
    if (isPwaLocalMode) {
      const result = bulkCreateLocalEntries(payload);
      await refreshLocalCaches();
      return result;
    }

    const response = await fetch("/api/entries/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const payloadError = await response.json().catch(() => ({}));
      throw new Error(payloadError.error ?? "Failed to create bulk entries");
    }

    const result = await response.json();
    void Promise.all([mutate(summaryKey), mutate(entriesKey)]);
    return result as { created: number; skipped: { existing: number; daysOff: number; holidays: number } };
  }

  async function bulkDelete(payload: { startDate: string; endDate: string } | { dates: string[] }) {
    if (isPwaLocalMode) {
      const result = bulkDeleteLocalEntries(payload);
      await refreshLocalCaches();
      return result;
    }

    const response = await fetch("/api/entries/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const payloadError = await response.json().catch(() => ({}));
      throw new Error(payloadError.error ?? "Failed to bulk delete entries");
    }

    const result = await response.json();
    void Promise.all([mutate(summaryKey), mutate(entriesKey)]);
    return result as { deleted: number };
  }

  return {
    entries: data?.entries ?? [],
    stats: data?.stats,
    isLoading,
    error,
    saveEntry,
    deleteEntry,
    bulkCreate,
    bulkDelete,
  };
}
