"use client";

import { eachDayOfInterval } from "date-fns";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { utcDateToDateKey } from "@/lib/date";
import { isPhHolidayDateKey } from "@/lib/ph-holidays";
import type { UserSettingsDTO } from "@/types";

interface BulkEntryFormProps {
  settings?: UserSettingsDTO;
  onSubmit: (startDate: string, endDate: string) => Promise<{
    created: number;
    skipped: { existing: number; daysOff: number; holidays: number };
  }>;
}

export function BulkEntryForm({ settings, onSubmit }: BulkEntryFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!startDate || !endDate) {
      return null;
    }
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    if (end < start) {
      return null;
    }

    const userHolidays = new Set(settings?.holidays ?? []);
    const allDates = eachDayOfInterval({ start, end });
    const workingDays = allDates.filter((date) => {
      if (settings?.daysOff?.includes(date.getUTCDay())) {
        return false;
      }

      const dateKey = utcDateToDateKey(date);
      if (userHolidays.has(dateKey) || isPhHolidayDateKey(dateKey)) {
        return false;
      }

      return true;
    }).length;
    const projectedHours = workingDays * (settings?.defaultHoursPerDay ?? 8);
    return { workingDays, projectedHours };
  }, [startDate, endDate, settings]);

  async function handleSubmit() {
    try {
      setError(null);
      setResult(null);
      setIsSubmitting(true);
      const response = await onSubmit(startDate, endDate);
      setResult(
        `Created ${response.created} entries. Skipped ${response.skipped.daysOff} day-offs, ${response.skipped.holidays} holidays, and ${response.skipped.existing} existing entries.`,
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Bulk entry failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-display text-base font-semibold tracking-tight">Bulk Add Entries</p>
        <p className="text-xs text-muted">Create entries from defaults across a date range.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="bulkStart">Start Date</Label>
          <Input id="bulkStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="bulkEnd">End Date</Label>
          <Input id="bulkEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {preview ? (
        <div className="rounded-lg border border-border bg-background/60 p-3 text-sm text-muted">
          Working days: <span className="font-medium text-foreground">{preview.workingDays}</span> | Projected hours:{" "}
          <span className="font-display font-medium text-primary">{preview.projectedHours.toFixed(2)}h</span>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {result ? <p className="text-sm text-success">{result}</p> : null}

      <Button
        onClick={() => void handleSubmit()}
        disabled={!startDate || !endDate || isSubmitting}
        className="w-full gap-2 sm:w-auto"
      >
        <Plus className="h-4 w-4" />
        Add Entries
      </Button>
    </div>
  );
}
