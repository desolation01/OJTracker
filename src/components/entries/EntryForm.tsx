"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";

import type { EntryDTO, UserSettingsDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EntryFormProps {
  date: string;
  entry?: EntryDTO;
  settings?: UserSettingsDTO;
  isSaving?: boolean;
  onSave: (payload: {
    id?: string;
    date: string;
    hours: number;
    minutes: number;
    timeIn?: string;
    timeOut?: string;
    note?: string;
  }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

export function EntryForm({ date, entry, settings, isSaving, onSave, onDelete }: EntryFormProps) {
  const [hours, setHours] = useState<number>(entry?.hours ?? Math.floor(settings?.defaultHoursPerDay ?? 8));
  const [minutes, setMinutes] = useState<number>(entry?.minutes ?? 0);
  const [timeIn, setTimeIn] = useState<string>(entry?.timeIn ?? settings?.defaultStartTime ?? "08:00");
  const [timeOut, setTimeOut] = useState<string>(entry?.timeOut ?? settings?.defaultEndTime ?? "17:00");
  const [note, setNote] = useState<string>(entry?.note ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHours(entry?.hours ?? Math.floor(settings?.defaultHoursPerDay ?? 8));
    setMinutes(entry?.minutes ?? 0);
    setTimeIn(entry?.timeIn ?? settings?.defaultStartTime ?? "08:00");
    setTimeOut(entry?.timeOut ?? settings?.defaultEndTime ?? "17:00");
    setNote(entry?.note ?? "");
    setError(null);
  }, [date, entry, settings]);

  const saveDisabled = useMemo(() => hours < 0 || hours > 24 || minutes < 0 || minutes > 59, [hours, minutes]);

  const handleSave = useCallback(async () => {
    if (hours * 60 + minutes <= 0) {
      setError("Total duration must be greater than 0.");
      return;
    }

    if (timeIn && timeOut && timeIn > timeOut) {
      setError("Time in appears after time out.");
    } else {
      setError(null);
    }

    await onSave({
      id: entry?.id,
      date,
      hours,
      minutes,
      timeIn,
      timeOut,
      note,
    });
  }, [date, entry?.id, hours, minutes, note, onSave, timeIn, timeOut]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-display text-base font-semibold tracking-tight">Entry for {date}</p>
        <p className="text-xs text-muted">Manual log or edit existing day entry.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="hours">Hours</Label>
          <Input
            id="hours"
            type="number"
            min={0}
            max={24}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="minutes">Minutes</Label>
          <Input
            id="minutes"
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="timeIn">Time In</Label>
          <Input id="timeIn" type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="timeOut">Time Out</Label>
          <Input id="timeOut" type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" placeholder="Optional notes..." value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleSave()} disabled={isSaving || saveDisabled} className="gap-2">
          <Save className="h-4 w-4" />
          {entry ? "Update Entry" : "Save Entry"}
        </Button>
        {entry && onDelete ? (
          <Button variant="danger" onClick={() => void onDelete(entry.id)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        ) : null}
      </div>
    </div>
  );
}
