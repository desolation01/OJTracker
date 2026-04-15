import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "muted" | "danger";
}

const classMap: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  danger: "bg-danger/15 text-danger border-danger/30",
  muted: "bg-surface-elevated/50 text-muted border-border",
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        classMap[variant],
        className,
      )}
      {...props}
    />
  );
}
