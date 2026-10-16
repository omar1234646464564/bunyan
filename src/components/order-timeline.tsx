import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        تم إلغاء هذا الطلب.
      </p>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status as never);

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const done = index <= currentIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
                done
                  ? "bg-teal-700 text-white"
                  : "bg-zinc-100 text-zinc-500",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                  done ? "bg-white text-teal-700" : "bg-zinc-300 text-white",
                )}
              >
                {index + 1}
              </span>
              {ORDER_STATUS_LABELS[step]}
            </span>
            {index < ORDER_STATUS_FLOW.length - 1 ? (
              <span className="text-zinc-300">—</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
