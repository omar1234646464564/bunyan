import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set("page", String(target));
    return `${basePath}?${search.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        >
          السابق
        </Link>
      ) : null}
      {pages.map((p, index) => (
        <span key={p} className="flex items-center gap-1">
          {index > 0 && p - pages[index - 1] > 1 ? (
            <span className="px-1 text-zinc-400">…</span>
          ) : null}
          <Link
            href={buildHref(p)}
            className={
              p === page
                ? "rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm hover:bg-zinc-50"
            }
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
        >
          التالي
        </Link>
      ) : null}
    </nav>
  );
}
