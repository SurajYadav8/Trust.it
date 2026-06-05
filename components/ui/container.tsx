import { HTMLAttributes } from "react";
import { cn } from "@/lib/format";

export function Container({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}
      {...rest}
    />
  );
}

export function PageHeading({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        {eyebrow ? (
          <div className="text-xs font-medium uppercase tracking-wider text-brand-600 mb-2 dark:text-accent-300">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-white">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-ink-600 mt-1.5 max-w-2xl dark:text-white/65">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}
