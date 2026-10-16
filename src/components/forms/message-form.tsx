"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function MessageForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.fieldErrors?.body ? (
        <Alert variant="error">{state.fieldErrors.body[0]}</Alert>
      ) : null}
      <Textarea
        name="body"
        placeholder="اكتب رسالتك..."
        className="min-h-20"
        required
      />
      <div className="flex justify-end">
        <SubmitButton size="sm" pendingText="جارٍ الإرسال...">
          <Send className="h-4 w-4" />
          إرسال
        </SubmitButton>
      </div>
    </form>
  );
}
