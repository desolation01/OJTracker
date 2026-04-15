"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockDisplay } from "@/components/timeclock/ClockDisplay";
import { ClockControls } from "@/components/timeclock/ClockControls";
import { useTimeClock } from "@/hooks/useTimeClock";

export default function TimeClockPage() {
  const { session, elapsedSeconds, isLoading, clockIn, clockOut } = useTimeClock();
  const [summary, setSummary] = useState<string | null>(null);

  async function handleClockIn() {
    try {
      await clockIn();
      setSummary(null);
      toast.success("Clocked in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Clock in failed.");
    }
  }

  async function handleClockOut() {
    try {
      const result = await clockOut();
      setSummary(`Logged ${result.elapsedMinutes} minutes on ${result.sessionDate}.`);
      toast.success("Clocked out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Clock out failed.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ClockDisplay elapsedSeconds={elapsedSeconds} activeClockIn={session?.clockIn ?? null} />

      <Card>
        <CardHeader>
          <CardTitle>Session Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ClockControls
            isClockedIn={Boolean(session)}
            isLoading={isLoading}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
          />
          {summary ? <p className="text-sm text-success">{summary}</p> : null}
          <p className="text-xs text-muted">Active sessions stay persisted even after refresh or page changes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
