import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-ink-500 mx-auto max-w-md">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
