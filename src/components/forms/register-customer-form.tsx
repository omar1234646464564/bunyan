"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomer } from "@/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Select } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { SAUDI_CITIES } from "@/lib/constants";

export function RegisterCustomerForm() {
  const [state, action] = useActionState(registerCustomer, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="الاسم الكامل" error={state.fieldErrors?.name}>
        <Input name="name" placeholder="مثال: عبدالله المطيري" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="البريد الإلكتروني" error={state.fieldErrors?.email}>
          <Input name="email" type="email" autoComplete="email" required />
        </Field>
        <Field
          label="رقم الجوال"
          hint="مثال: 0512345678"
          error={state.fieldErrors?.phone}
        >
          <Input name="phone" inputMode="tel" placeholder="05xxxxxxxx" />
        </Field>
      </div>

      <Field label="المدينة" error={state.fieldErrors?.city}>
        <Select name="city" defaultValue="">
          <option value="">اختر المدينة (اختياري)</option>
          {SAUDI_CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="كلمة المرور"
        hint="8 أحرف على الأقل"
        error={state.fieldErrors?.password}
      >
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <SubmitButton className="w-full">إنشاء حساب عميل</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        لديك حساب؟{" "}
        <Link href="/login" className="font-medium text-teal-700">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
