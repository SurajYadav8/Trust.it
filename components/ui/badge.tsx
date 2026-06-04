import { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Tone = "neutral" | "success" | "danger" | "brand" | "warn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  success: "bg-success-50 text-success-700 border-success-500/30",
  danger: "bg-danger-50 text-danger-700 border-danger-500/30",
  brand: "bg-brand-50 text-brand-700 border-brand-500/30",
  warn: "bg-amber-50 text-amber-800 border-amber-500/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...rest}
    />
  );
}
