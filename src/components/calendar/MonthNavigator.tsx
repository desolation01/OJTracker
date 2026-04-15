"use client";

import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface MonthNavigatorProps {
  monthDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ monthDate, onPrev, onNext }: MonthNavigatorProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        onPrev();
      }
      if (event.key === "ArrowRight") {
        onNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNext, onPrev]);

  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" onClick={onPrev} className="h-8 w-8 p-0">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <h2 className="font-display text-lg font-semibold tracking-tight">{format(monthDate, "MMMM yyyy")}</h2>
      <Button variant="outline" size="sm" onClick={onNext} className="h-8 w-8 p-0">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
