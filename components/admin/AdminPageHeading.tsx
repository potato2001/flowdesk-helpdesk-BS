import type { ReactNode } from "react";

/** Shared heading shape so every admin screen reads the same. */
export function AdminPageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
