import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatNumber, formatSAR, toNumber } from "@/lib/format";
import { UNIT_LABELS } from "@/lib/constants";
import { Card } from "@/components/ui/card";

export type MaterialCardData = {
  id: string;
  name: string;
  price: number | string | { toString(): string };
  unit: string;
  city: string;
  minOrderQty: number;
  imageUrl?: string | null;
  category?: { name: string } | null;
};

export function MaterialCard({ material }: { material: MaterialCardData }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/materials/${material.id}`} className="block">
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-teal-50 to-zinc-100 text-teal-800/40">
          {material.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={material.imageUrl}
              alt={material.name}
              className="h-40 w-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold">{material.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="p-4">
          {material.category ? (
            <span className="text-xs font-medium text-teal-700">
              {material.category.name}
            </span>
          ) : null}
          <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-zinc-900 group-hover:text-teal-800">
            {material.name}
          </h3>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-base font-bold text-zinc-900">
                {formatSAR(toNumber(material.price))}
              </p>
              <p className="text-xs text-zinc-500">
                / {UNIT_LABELS[material.unit] ?? material.unit}
              </p>
            </div>
            <div className="text-left text-xs text-zinc-500">
              <p className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {material.city}
              </p>
              <p className="mt-1">
                أدنى كمية {formatNumber(material.minOrderQty)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
