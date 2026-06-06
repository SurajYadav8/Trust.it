import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/format";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    labelClassName,
    hint,
    error,
    prefix,
    suffix,
    className,
    id,
    ...rest
  },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-1.5 block text-sm font-medium text-ink-700 dark:text-white/70",
            labelClassName
          )}
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-md border bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500 dark:bg-white/[0.04] dark:focus-within:ring-accent-400/30 dark:focus-within:border-accent-400/60",
          error
            ? "border-danger-500"
            : "border-ink-200 dark:border-white/12"
        )}
      >
        {prefix ? (
          <span className="pl-3 text-ink-400 text-sm select-none dark:text-white/40">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex-1 bg-transparent px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none dark:text-white dark:placeholder:text-white/35",
            className
          )}
          {...rest}
        />
        {suffix ? (
          <span className="pr-3 text-ink-400 text-sm select-none dark:text-white/40">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-ink-500 dark:text-white/45">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs text-danger-700 dark:text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
});
