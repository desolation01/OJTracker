"use client";

import type { EntryDTO } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentEntriesProps {
  entries: EntryDTO[];
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  const recent = [...entries].sort((a, b) => (a.date > b.date ? -1 : 1)).slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No recent entries yet.</p>
        ) : (
          recent.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-background/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{entry.date}</p>
                <p className="truncate text-xs text-muted">{entry.note || "No note"}</p>
              </div>
              <div className="ml-3 shrink-0 font-display text-sm text-primary">
                {(entry.hours + entry.minutes / 60).toFixed(2)}h
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
