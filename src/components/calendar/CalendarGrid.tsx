"use client";

import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import { localDateToDateKey } from "@/lib/date";
import { getPhHoliday } from "@/lib/ph-holidays";
import type { EntryDTO } from "@/types";
import { CalendarDay } from "@/components/calendar/CalendarDay";

interface CalendarGridProps {
  monthDate: Date;
  entries: EntryDTO[];
  daysOff: number[];
  holidays?: string[];
  onSelectDate: (dateKey: string) => void;
  selectedDates?: string[] | null;
  onSelectionChange?: (selection: { dates: string[]; startDate: string; endDate: string }) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  monthDate,
  entries,
  daysOff,
  holidays = [],
  onSelectDate,
  selectedDates,
  onSelectionChange,
}: CalendarGridProps) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const monthDates = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmptyCells = getDay(monthStart);
  const cells: Array<Date | null> = [
    ...Array.from({ length: leadingEmptyCells }, () => null),
    ...monthDates,
  ];
  const entryMap = new Map(entries.map((entry) => [entry.date, entry]));
  const [dragSelectionDates, setDragSelectionDates] = useState<string[]>([]);
  const [dragCurrentDate, setDragCurrentDate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  const activeSelection = isDragging ? dragSelectionDates : selectedDates ?? null;
  const activeSelectionSet = useMemo(
    () => new Set(activeSelection ?? []),
    [activeSelection],
  );

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    function onPointerUp() {
      if (!dragCurrentDate || dragSelectionDates.length === 0) {
        setIsDragging(false);
        setHasDragged(false);
        setDragSelectionDates([]);
        setDragCurrentDate(null);
        return;
      }

      const dates = [...dragSelectionDates];
      const sortedDates = [...dates].sort();
      onSelectionChange?.({
        dates,
        startDate: sortedDates[0],
        endDate: sortedDates[sortedDates.length - 1],
      });
      onSelectDate(dragCurrentDate);
      setIsDragging(false);
      setHasDragged(false);
      setDragSelectionDates([]);
      setDragCurrentDate(null);
    }

    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, [dragCurrentDate, dragSelectionDates, isDragging, onSelectDate, onSelectionChange]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => (
          <div key={day} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[100px] rounded-md border border-transparent" />;
          }

          const dateKey = localDateToDateKey(date);
          const isRangeSelected = activeSelectionSet.has(dateKey);
          const isRangeBoundary = Boolean(
            activeSelection &&
              activeSelection.length > 0 &&
              (dateKey === activeSelection[0] || dateKey === activeSelection[activeSelection.length - 1]),
          );

          const phHoliday = getPhHoliday(date);
          const isUserHoliday = holidays.includes(dateKey);
          const holiday = phHoliday ?? (isUserHoliday ? "Holiday" : null);

          return (
            <CalendarDay
              key={`${format(date, "yyyy-MM-dd")}-cell`}
              date={date}
              isCurrentMonth
              isDayOff={daysOff.includes(date.getDay())}
              entry={entryMap.get(dateKey)}
              holiday={holiday}
              onClick={() => onSelectDate(dateKey)}
              onPointerDown={() => {
                setIsDragging(true);
                setHasDragged(false);
                setDragSelectionDates([dateKey]);
                setDragCurrentDate(dateKey);
              }}
              onPointerEnter={() => {
                if (!isDragging) {
                  return;
                }

                if (dragCurrentDate && dragCurrentDate !== dateKey) {
                  setHasDragged(true);
                }
                setDragSelectionDates((prev) => (prev.includes(dateKey) ? prev : [...prev, dateKey]));
                setDragCurrentDate(dateKey);
              }}
              isRangeSelected={isRangeSelected}
              isRangeBoundary={isRangeBoundary}
            />
          );
        })}
      </div>

      {isDragging && hasDragged ? (
        <p className="text-xs text-muted">Drag to select a range, then release to apply bulk actions.</p>
      ) : null}
    </div>
  );
}
