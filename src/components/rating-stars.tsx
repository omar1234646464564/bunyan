import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i <= rounded ? "fill-amber-400 text-amber-400" : "text-zinc-300",
            )}
          />
        ))}
      </span>
      {typeof count === "number" ? (
        <span className="text-xs text-zinc-500">
          {value > 0 ? value.toFixed(1) : "جديد"} {count > 0 ? `(${count})` : ""}
        </span>
      ) : null}
    </span>
  );
}
