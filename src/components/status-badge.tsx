import { Badge } from "@/components/ui/card";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  SUPPLIER_STATUS_LABELS,
  SUPPLIER_STATUS_STYLES,
} from "@/lib/constants";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={ORDER_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export function SupplierStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={SUPPLIER_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}>
      {SUPPLIER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
