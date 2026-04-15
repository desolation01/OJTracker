"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parse } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BulkEntryForm } from "@/components/entries/BulkEntryForm";
import { EntryTable } from "@/components/entries/EntryTable";
import { useEntries } from "@/hooks/useEntries";
import { useSettings } from "@/hooks/useSettings";
import { monthKeyFromDate } from "@/lib/date";

export default function EntriesPage() {
  const [monthKey, setMonthKey] = useState(monthKeyFromDate(new Date()));
  const { entries, bulkCreate } = useEntries(monthKey);
  const { settings } = useSettings();

  const monthDate = useMemo(() => parse(`${monthKey}-01`, "yyyy-MM-dd", new Date()), [monthKey]);

  async function handleBulkCreate(startDate: string, endDate: string) {
    const result = await bulkCreate(startDate, endDate);
    toast.success(`Created ${result.created} entries.`);
    return result;
  }

  function shiftMonth(delta: number) {
    const shifted = addMonths(monthDate, delta);
    setMonthKey(format(shifted, "yyyy-MM"));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Entries - {format(monthDate, "MMMM yyyy")}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftMonth(-1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => shiftMonth(1)}>
              Next
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EntryTable entries={entries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <BulkEntryForm settings={settings} onSubmit={handleBulkCreate} />
        </CardContent>
      </Card>
    </div>
  );
}
