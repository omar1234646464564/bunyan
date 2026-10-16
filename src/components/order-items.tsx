import { formatNumber, formatSAR, toNumber } from "@/lib/format";
import { UNIT_LABELS } from "@/lib/constants";

export type OrderItemData = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number | string | { toString(): string };
  lineTotal: number | string | { toString(): string };
};

export function OrderItems({
  items,
  subtotal,
  vat,
  total,
}: {
  items: OrderItemData[];
  subtotal: number | string | { toString(): string };
  vat: number | string | { toString(): string };
  total: number | string | { toString(): string };
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-right text-xs text-zinc-500">
              <th className="py-2 font-medium">المادة</th>
              <th className="py-2 font-medium">الكمية</th>
              <th className="py-2 font-medium">السعر</th>
              <th className="py-2 font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-zinc-100">
                <td className="py-3 font-medium text-zinc-800">{item.name}</td>
                <td className="py-3 text-zinc-600">
                  {formatNumber(item.quantity)}{" "}
                  {UNIT_LABELS[item.unit] ?? item.unit}
                </td>
                <td className="py-3 text-zinc-600">
                  {formatSAR(toNumber(item.unitPrice))}
                </td>
                <td className="py-3 text-zinc-800">
                  {formatSAR(toNumber(item.lineTotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4 text-sm">
        <div className="flex justify-between text-zinc-600">
          <span>المجموع الفرعي</span>
          <span>{formatSAR(toNumber(subtotal))}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>ضريبة القيمة المضافة (15%)</span>
          <span>{formatSAR(toNumber(vat))}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900">
          <span>الإجمالي</span>
          <span>{formatSAR(toNumber(total))}</span>
        </div>
      </div>
    </div>
  );
}
