"use client";

import { useActionState } from "react";
import { createCategory } from "@/actions/admin";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function CategoryForm() {
  const [state, action] = useActionState(createCategory, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <Field label="اسم التصنيف" error={state.fieldErrors?.name}>
        <Input name="name" placeholder="مثال: أدوات يدوية" required />
      </Field>
      <Field label="المعرّف (slug)" hint="بالإنجليزية، اختياري">
        <Input name="slug" placeholder="tools" />
      </Field>
      <Field label="الأيقونة" hint="اسم أيقونة Lucide، اختياري">
        <Input name="icon" placeholder="Wrench" />
      </Field>
      <SubmitButton size="sm">إضافة تصنيف</SubmitButton>
    </form>
  );
}
