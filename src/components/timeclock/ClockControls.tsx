"use client";

import { Clock, StopCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ClockControlsProps {
  isClockedIn: boolean;
  isLoading?: boolean;
  onClockIn: () => Promise<void> | void;
  onClockOut: () => Promise<void> | void;
}

export function ClockControls({ isClockedIn, isLoading, onClockIn, onClockOut }: ClockControlsProps) {
  return isClockedIn ? (
    <Button
      className="h-14 w-full gap-2 text-lg animate-pulseSoft"
      variant="danger"
      disabled={isLoading}
      onClick={() => void onClockOut()}
    >
      <StopCircle className="h-5 w-5" />
      Clock Out
    </Button>
  ) : (
    <Button
      className="h-14 w-full gap-2 text-lg"
      disabled={isLoading}
      onClick={() => void onClockIn()}
    >
      <Clock className="h-5 w-5" />
      Clock In
    </Button>
  );
}
