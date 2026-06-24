import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground hover:brightness-95",
        variant === "secondary" &&
          "border-border bg-secondary text-secondary-foreground hover:bg-muted",
        variant === "ghost" &&
          "border-transparent bg-transparent text-foreground hover:bg-muted",
        variant === "danger" &&
          "border-destructive bg-destructive text-destructive-foreground hover:brightness-95",
        size === "sm" && "h-8 px-3",
        size === "md" && "h-10 px-4",
        size === "icon" && "h-9 w-9",
        className
      )}
      {...props}
    />
  );
}
