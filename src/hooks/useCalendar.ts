"use client";

import { addMonths } from "date-fns";
import { useMemo, useState } from "react";

import { monthKeyFromDate } from "@/lib/date";

export function useCalendar() {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
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
