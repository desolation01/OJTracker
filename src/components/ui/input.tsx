import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg border border-border bg-background/80 px-3.5 py-2 text-sm text-foreground placeholder:text-muted/60 outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-background",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";
