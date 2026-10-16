import Link from "next/link";
import { MapPin, Package } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <Package className="h-6 w-6" />
      </span>
      <p className="mt-4 text-base font-semibold text-zinc-800">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          {actionLabel}
          <MapPin className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
