import { ReactNode } from "react";
import { cn } from "@/lib/format";
import { EMPTY_STATE_CLASS } from "@/lib/ui-classes";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(EMPTY_STATE_CLASS, className)}>
      <h3 className="text-base font-semibold text-ink-900 dark:text-white">
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-500 dark:text-white/50">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
