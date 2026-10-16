"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function ReviewForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  const [rating, setRating] = useState(5);

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <div>
        <span className="mb-1.5 block text-sm font-medium text-zinc-700">
          التقييم
        </span>
        <div className="flex items-center gap-1">
          <input type="hidden" name="rating" value={rating} />
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              aria-label={`${i} نجوم`}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  i <= rating ? "fill-amber-400 text-amber-400" : "text-zinc-300",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Textarea name="comment" placeholder="شاركنا تجربتك مع المورد..." />

      <SubmitButton size="sm">إرسال التقييم</SubmitButton>
    </form>
  );
}
