"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Shield, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isPwaLocalMode } from "@/lib/pwa-mode";

interface OJTUser {
  id: string;
  name: string;
  email: string;
  daysAttended: number;
  absences: number;
  totalHours: number;
  targetHours: number;
  remainingHours: number;
  percentComplete: number;
  estimatedDaysLeft: number;
  estimatedCompletionDate: string | null;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? "Request failed");
  }
  return response.json();
};

export default function AdminPage() {
  if (isPwaLocalMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Local PWA mode does not include multi-user admin features.
        </CardContent>
      </Card>
    );
  }

  const { data, isLoading, error } = useSWR<{ users: OJTUser[] }>("/api/admin/users", fetcher);
  const [sortKey, setSortKey] = useState<keyof OJTUser>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = data?.users
    ? [...data.users].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const cmp = typeof aVal === "string" ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
        return sortDir === "asc" ? cmp : -cmp;
      })
    : [];

  function toggleSort(key: keyof OJTUser) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ colKey }: { colKey: keyof OJTUser }) {
    if (sortKey !== colKey) return null;
    return <span className="ml-1 text-primary">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted">Monitor OJT trainee progress</p>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-danger">
            {error.message || "Failed to load data. Make sure you have admin access."}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted">Loading OJT data...</CardContent>
        </Card>
      ) : !data?.users.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted/40" />
            No OJT trainees found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Trainees ({data.users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/30">
                  {[
                    { key: "name" as keyof OJTUser, label: "Name" },
                    { key: "daysAttended" as keyof OJTUser, label: "Days Attended" },
                    { key: "absences" as keyof OJTUser, label: "Absences" },
                    { key: "totalHours" as keyof OJTUser, label: "Total Hours" },
                    { key: "remainingHours" as keyof OJTUser, label: "Hours Left" },
                    { key: "estimatedDaysLeft" as keyof OJTUser, label: "Days Left" },
                    { key: "percentComplete" as keyof OJTUser, label: "Progress" },
                    { key: "estimatedCompletionDate" as keyof OJTUser, label: "Est. End Date" },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      className="cursor-pointer px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-foreground"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      <SortIcon colKey={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border transition-colors duration-150 hover:bg-surface-elevated/20"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 font-display">{u.daysAttended}</td>
                    <td className="px-4 py-3">
                      {u.absences > 0 ? (
                        <Badge variant="danger">{u.absences}</Badge>
                      ) : (
                        <Badge variant="success">0</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-display text-primary">{u.totalHours}h</td>
                    <td className="px-4 py-3 font-display">{u.remainingHours}h</td>
                    <td className="px-4 py-3 font-display">{u.estimatedDaysLeft}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-pill bg-surface">
                          <div
                            className="h-full rounded-pill gradient-primary transition-all duration-500"
                            style={{ width: `${Math.min(100, u.percentComplete)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted">{u.percentComplete}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{u.estimatedCompletionDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
