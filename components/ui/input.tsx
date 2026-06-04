import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/format";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, prefix, suffix, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink-700 mb-1.5"
        >
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-md border bg-white transition-colors focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500",
          error ? "border-danger-500" : "border-ink-200"
        )}
      >
        {prefix ? (
          <span className="pl-3 text-ink-400 text-sm select-none">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex-1 bg-transparent px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none",
            className
          )}
          {...rest}
        />
        {suffix ? (
          <span className="pr-3 text-ink-400 text-sm select-none">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-xs text-danger-700">{error}</p>
      ) : null}
    </div>
  );
});
