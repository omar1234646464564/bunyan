import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";

export type SupplierCardData = {
  slug: string;
  companyName: string;
  city: string;
  region: string;
  description?: string | null;
  ratingSum: number;
  ratingCount: number;
  _count?: { materials: number };
};

export function SupplierCard({ supplier }: { supplier: SupplierCardData }) {
  const avg = supplier.ratingCount > 0 ? supplier.ratingSum / supplier.ratingCount : 0;

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/suppliers/${supplier.slug}`} className="block p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
            {supplier.companyName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 group-hover:text-teal-800">
              {supplier.companyName}
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {supplier.city} — {supplier.region}
            </p>
          </div>
        </div>
        {supplier.description ? (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
            {supplier.description}
          </p>
        ) : null}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
          <RatingStars value={avg} count={supplier.ratingCount} />
          <span className="text-xs text-zinc-500">
            {supplier._count?.materials ?? 0} مادة
          </span>
        </div>
      </Link>
    </Card>
  );
}
