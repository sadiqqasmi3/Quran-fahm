import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-muted">{description}</p>
        </div>
        {action}
      </div>
    </header>
  );
}
