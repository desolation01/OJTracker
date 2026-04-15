"use client";

import type { EntryDTO } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface EntryTableProps {
  entries: EntryDTO[];
}

export function EntryTable({ entries }: EntryTableProps) {
  return (
    <Card>
      <CardContent className="overflow-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/30">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Date</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Hours</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Time In</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Time Out</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Source</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Note</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No entries yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border transition-colors duration-150 hover:bg-surface-elevated/20">
                  <td className="px-4 py-3 font-medium">{entry.date}</td>
                  <td className="px-4 py-3 font-display text-primary">{(entry.hours + entry.minutes / 60).toFixed(2)}h</td>
                  <td className="px-4 py-3 text-muted">{entry.timeIn ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{entry.timeOut ?? "-"}</td>
                  <td className="px-4 py-3 text-muted">{entry.source}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-muted">{entry.note ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
