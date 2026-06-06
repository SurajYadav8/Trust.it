import { cn } from "@/lib/format";
import {
  LANDLORD_MIN_EMPLOYMENT_OPTIONS,
  LandlordMinEmploymentMonths,
} from "@/lib/employment-duration";

export function EmploymentDurationSelect({
  value,
  onChange,
  disabled,
  variant = "segmented",
}: {
  value: LandlordMinEmploymentMonths;
  onChange: (minMonths: LandlordMinEmploymentMonths) => void;
  disabled?: boolean;
  variant?: "segmented" | "list";
}) {
  if (variant === "list") {
    return (
      <div className="space-y-2">
        {LANDLORD_MIN_EMPLOYMENT_OPTIONS.map((opt) => (
          <DurationOption
            key={opt.label}
            label={opt.label}
            selected={value === opt.minMonths}
            disabled={disabled}
            onClick={() => onChange(opt.minMonths)}
            className="w-full rounded-xl px-4 py-3.5 text-left text-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-1 rounded-lg border border-ink-200/70 bg-ink-50/40 p-1",
        "dark:border-white/10 dark:bg-white/[0.02]"
      )}
      role="group"
      aria-label="Minimum employment duration"
    >
      {LANDLORD_MIN_EMPLOYMENT_OPTIONS.map((opt) => (
        <DurationOption
          key={opt.label}
          label={opt.label}
          selected={value === opt.minMonths}
          disabled={disabled}
          onClick={() => onChange(opt.minMonths)}
          className="rounded-md px-2.5 py-2 text-center text-xs sm:text-left"
        />
      ))}
    </div>
  );
}

function DurationOption({
  label,
  selected,
  disabled,
  onClick,
  className,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "font-medium transition-all duration-200",
        className,
        selected
          ? "bg-white text-brand-700 shadow-sm ring-1 ring-accent-400/30 dark:bg-white/10 dark:text-accent-100 dark:ring-accent-400/25"
          : "text-ink-600 hover:bg-white/60 hover:text-ink-900 dark:text-white/55 dark:hover:bg-white/[0.04] dark:hover:text-white/85",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {label}
    </button>
  );
}
