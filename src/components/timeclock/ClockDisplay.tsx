"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatClockDuration } from "@/lib/utils";

interface ClockDisplayProps {
  elapsedSeconds: number;
  activeClockIn?: string | null;
}

export function ClockDisplay({ elapsedSeconds, activeClockIn }: ClockDisplayProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Time Clock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted">Current Time</p>
          <p className="font-display text-3xl tracking-tight">{now ? format(now, "HH:mm:ss") : "--:--:--"}</p>
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted">Elapsed</p>
          <p className="font-display text-4xl tracking-tight text-primary">{formatClockDuration(elapsedSeconds)}</p>
        </div>
        {activeClockIn ? (
          <p className="text-xs text-muted">
            Session started at {now ? format(new Date(activeClockIn), "PPpp") : "--"}
          </p>
        ) : (
          <p className="text-xs text-muted">No active session.</p>
        )}
      </CardContent>
    </Card>
  );
}
