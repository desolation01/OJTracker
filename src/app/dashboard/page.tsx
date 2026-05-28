"use client";

import { useMemo, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Eraser, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
import { MonthNavigator } from "@/components/calendar/MonthNavigator";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { EntryForm } from "@/components/entries/EntryForm";
import { useCalendar } from "@/hooks/useCalendar";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useSettings } from "@/hooks/useSettings";
import { dateKeyToUTCDate, utcDateToDateKey } from "@/lib/date";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { currentMonthDate, monthKey, selectedDate, setSelectedDate, nextMonth, prevMonth } = useCalendar();
  const { entries, stats, saveEntry, deleteEntry, bulkCreate, bulkDelete } = useDashboardData(monthKey);
  const { settings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const activeDate = selectedDate ?? utcDateToDateKey(new Date());
  const activeEntry = useMemo(() => entries.find((entry) => entry.date === activeDate), [activeDate, entries]);
  const selectedRangeDays = useMemo(() => {
    if (selectedDates.length === 0) {
      return 0;
    }

    return (
      Math.abs(
        differenceInCalendarDays(
          dateKeyToUTCDate(selectedDates[selectedDates.length - 1]),
          dateKeyToUTCDate(selectedDates[0]),
        ),
      ) + 1
    );
  }, [selectedDates]);
  const selectedBounds = useMemo(() => {
    if (selectedDates.length === 0) {
      return null;
    }
    const sorted = [...selectedDates].sort();
    return {
      startDate: sorted[0],
      endDate: sorted[sorted.length - 1],
    };
  }, [selectedDates]);

  async function handleSave(payload: {
    id?: string;
    date: string;
    hours: number;
    minutes: number;
    timeIn?: string;
    timeOut?: string;
    note?: string;
  }) {
    try {
      setIsSaving(true);
      await saveEntry(payload);
      toast.success("Entry saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save entry.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    try {
      await deleteEntry(entryId);
      toast.success("Entry deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete entry.");
    }
  }

  async function handleBulkAdd() {
    if (selectedDates.length === 0) {
      return;
    }

    try {
      setIsBulkSaving(true);
      const result = await bulkCreate({ dates: selectedDates });
      toast.success(
        `Created ${result.created} entries (${result.skipped.existing} existing, ${result.skipped.daysOff} day offs).`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to bulk add entries.");
    } finally {
      setIsBulkSaving(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedDates.length === 0) {
      return;
    }

    try {
      setIsBulkSaving(true);
      const result = await bulkDelete({ dates: selectedDates });
      toast.success(`Deleted ${result.deleted} entries in selected range.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to bulk delete entries.");
    } finally {
      setIsBulkSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <StatsCards stats={stats} />

      <Card>
        <CardContent className="pt-4">
          <ProgressBar
            percent={stats?.percentComplete ?? 0}
            totalHours={stats?.totalHours}
            targetHours={stats?.targetHours}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <MonthNavigator monthDate={currentMonthDate} onPrev={prevMonth} onNext={nextMonth} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted">
                {selectedDates.length > 0
                  ? `Selected ${selectedDates.length} cells (${selectedBounds?.startDate} to ${selectedBounds?.endDate}, span ${selectedRangeDays} days)`
                  : "Drag across days in calendar to select exact cells."}
              </p>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDates([])}
                  disabled={selectedDates.length === 0 || isBulkSaving}
                >
                  <Eraser className="h-4 w-4" />
                  Clear Range
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleBulkAdd()}
                  disabled={selectedDates.length === 0 || isBulkSaving}
                >
                  <Plus className="h-4 w-4" />
                  Bulk Add
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void handleBulkDelete()}
                  disabled={selectedDates.length === 0 || isBulkSaving}
                >
                  <Trash2 className="h-4 w-4" />
                  Bulk Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarGrid
              monthDate={currentMonthDate}
              entries={entries}
              daysOff={settings?.daysOff ?? [0, 6]}
              holidays={settings?.holidays ?? []}
              onSelectDate={setSelectedDate}
              selectedDates={selectedDates}
              onSelectionChange={({ dates }) => setSelectedDates(dates)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <EntryForm
                date={activeDate}
                entry={activeEntry}
                settings={settings}
                isSaving={isSaving}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
          <RecentEntries entries={entries} />
        </div>
      </div>
    </div>
  );
}
