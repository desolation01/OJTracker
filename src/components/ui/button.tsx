import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "danger" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClassMap: Record<ButtonVariant, string> = {
  default:
    "gradient-primary text-background shadow-glow hover:shadow-lg hover:brightness-110 active:brightness-95",
  outline:
    "border border-border bg-surface/50 text-foreground hover:bg-surface-elevated hover:border-primary/30 active:bg-surface",
  danger:
    "gradient-danger text-white shadow-glow-danger hover:shadow-lg hover:brightness-110 active:brightness-95",
  ghost: "bg-transparent text-foreground hover:bg-surface/60 active:bg-surface/40",
};

const sizeClassMap: Record<ButtonSize, string> = {
  default: "h-10 px-5 py-2 text-sm",
  sm: "h-8 px-3.5 text-xs",
  lg: "h-12 px-6 text-base",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40",
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
