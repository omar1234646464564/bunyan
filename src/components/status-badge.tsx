import { Badge } from "@/components/ui/card";
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from "@/lib/constants";

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={ORDER_STATUS_STYLES[status] ?? "bg-zinc-100 text-zinc-700"}>
      {ORDER_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
