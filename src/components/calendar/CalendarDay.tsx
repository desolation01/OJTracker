"use client";

import { format, isToday } from "date-fns";

import { cn } from "@/lib/utils";
import type { EntryDTO } from "@/types";

interface CalendarDayProps {
  date: Date;
  entry?: EntryDTO;
  isCurrentMonth: boolean;
  isDayOff: boolean;
  holiday?: string | null;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerEnter?: () => void;
  onPointerUp?: () => void;
  isRangeSelected?: boolean;
  isRangeBoundary?: boolean;
}

export function CalendarDay({
  date,
  entry,
  isCurrentMonth,
  isDayOff,
  holiday,
  onClick,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  isRangeSelected,
  isRangeBoundary,
}: CalendarDayProps) {
  const totalMinutes = entry ? entry.hours * 60 + entry.minutes : 0;
  const hasEntry = totalMinutes > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerUp={onPointerUp}
      className={cn(
        "group min-h-[100px] rounded-lg border p-2.5 text-left transition-all duration-200",
        isCurrentMonth ? "border-border bg-surface" : "border-border/40 bg-surface/30 text-muted",
        isDayOff && "opacity-60",
        hasEntry && "border-success/40",
        isRangeSelected && "bg-primary/8 ring-1 ring-primary/25",
        isRangeBoundary && "ring-2 ring-primary/60",
        isToday(date) && "ring-2 ring-primary",
        "hover:border-primary/40 hover:bg-surface-elevated/50",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={cn("font-display text-sm", isToday(date) && "text-primary")}>{format(date, "d")}</span>
        {isDayOff ? <span className="text-[10px] text-muted">Day off</span> : null}
      </div>

      {holiday ? (
        <div className="flex items-center justify-center py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400" title={holiday}>
            Holiday
          </span>
        </div>
      ) : null}

      {hasEntry ? (
        <div className="rounded-md bg-success/12 px-2 py-1 text-xs font-medium text-success">
          {(totalMinutes / 60).toFixed(2)}h
        </div>
      ) : (
        <div className="text-xs text-muted/50">No entry</div>
      )}
    </button>
  );
}
