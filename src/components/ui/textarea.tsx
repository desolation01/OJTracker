import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[80px] w-full rounded-lg border border-border bg-background/80 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
