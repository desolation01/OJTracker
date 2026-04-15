"use client";

interface ProgressBarProps {
  percent: number;
  totalHours?: number;
  targetHours?: number;
}

export function ProgressBar({ percent, totalHours, targetHours }: ProgressBarProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <p className="text-sm text-muted">Progress to target</p>
        <p className="font-display text-sm text-foreground">
          {totalHours?.toFixed(2) ?? "--"} / {targetHours ?? "--"}h
        </p>
      </div>
      <div className="relative h-3 overflow-hidden rounded-pill bg-surface">
        <div
          className="h-full rounded-pill gradient-primary transition-all duration-700 ease-out"
          style={{ width: `${clampedPercent}%` }}
        />
        <div
          className="absolute inset-0 overflow-hidden rounded-pill"
          style={{ width: `${clampedPercent}%` }}
        >
          <div className="animate-shimmer h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </div>
      <p className="text-right text-xs text-muted">{percent.toFixed(1)}%</p>
    </div>
  );
}
