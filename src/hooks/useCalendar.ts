"use client";

import { addMonths } from "date-fns";
import { useMemo, useState } from "react";

import { monthKeyFromDate } from "@/lib/date";

function getStableTodayDate() {
  const utcDateKey = new Date().toISOString().slice(0, 10);
  return new Date(`${utcDateKey}T00:00:00.000Z`);
}

export function useCalendar() {
  const [currentMonthDate, setCurrentMonthDate] = useState(getStableTodayDate);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthKey = useMemo(() => monthKeyFromDate(currentMonthDate), [currentMonthDate]);

  function nextMonth() {
    setCurrentMonthDate((prev) => addMonths(prev, 1));
  }

  function prevMonth() {
    setCurrentMonthDate((prev) => addMonths(prev, -1));
  }

  return {
    currentMonthDate,
    monthKey,
    selectedDate,
    setSelectedDate,
    nextMonth,
    prevMonth,
  };
}
