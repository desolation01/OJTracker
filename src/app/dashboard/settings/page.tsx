"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [targetHours, setTargetHours] = useState(600);
  const [defaultHoursPerDay, setDefaultHoursPerDay] = useState(8);
  const [defaultStartTime, setDefaultStartTime] = useState("08:00");
  const [defaultEndTime, setDefaultEndTime] = useState("17:00");
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [daysOff, setDaysOff] = useState<number[]>([0, 6]);
  const [ojtStartDate, setOjtStartDate] = useState<string>("");
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setTargetHours(settings.targetHours);
    setDefaultHoursPerDay(settings.defaultHoursPerDay);
    setDefaultStartTime(settings.defaultStartTime);
    setDefaultEndTime(settings.defaultEndTime);
    setTimezone(settings.timezone);
    setDaysOff(settings.daysOff);
    setOjtStartDate(settings.ojtStartDate ?? "");
    setHolidays(settings.holidays ?? []);
  }, [settings]);

  async function onSave() {
    try {
      setIsSaving(true);
      await updateSettings({
        targetHours,
        defaultHoursPerDay,
        defaultStartTime,
        defaultEndTime,
        timezone,
        daysOff,
        ojtStartDate: ojtStartDate || null,
        holidays,
      });
      toast.success("Settings updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleDay(day: number) {
    setDaysOff((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="targetHours">Target Hours</Label>
              <Input
                id="targetHours"
                type="number"
                min={1}
                value={targetHours}
                onChange={(e) => setTargetHours(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="defaultHours">Default Hours/Day</Label>
              <Input
                id="defaultHours"
                type="number"
                min={0.5}
                max={24}
                step={0.5}
                value={defaultHoursPerDay}
                onChange={(e) => setDefaultHoursPerDay(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="startTime">Default Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={defaultStartTime}
                onChange={(e) => setDefaultStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Default End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={defaultEndTime}
                onChange={(e) => setDefaultEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="ojtStartDate">OJT Start Date</Label>
            <p className="mb-1.5 text-xs text-muted">Used to calculate absences — days without an entry from this date onward.</p>
            <Input
              id="ojtStartDate"
              type="date"
              value={ojtStartDate}
              onChange={(e) => setOjtStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Days Off</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {dayLabels.map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(index)}
                  className={`rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                    daysOff.includes(index)
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border bg-background/60 text-muted hover:border-border-subtle hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Holidays</Label>
            <p className="mb-2 text-xs text-muted">Dates that are skipped when estimating your completion date (e.g. public holidays).</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newHoliday}
                onChange={(e) => setNewHoliday(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!newHoliday || holidays.includes(newHoliday)}
                onClick={() => {
                  if (newHoliday && !holidays.includes(newHoliday)) {
                    setHolidays((prev) => [...prev, newHoliday].sort());
                    setNewHoliday("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {holidays.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {holidays.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-danger/40"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => setHolidays((prev) => prev.filter((d) => d !== h))}
                      className="text-muted transition-colors hover:text-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button onClick={() => void onSave()} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
