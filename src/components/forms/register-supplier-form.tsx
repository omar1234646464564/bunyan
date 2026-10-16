"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerSupplier } from "@/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { RegionCitySelect } from "@/components/forms/region-city-select";

export function RegisterSupplierForm() {
  const [state, action] = useActionState(registerSupplier, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="اسم المنشأة / الشركة" error={state.fieldErrors?.companyName}>
        <Input name="companyName" placeholder="مثال: مؤسسة البناء الحديث" required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المسؤول" error={state.fieldErrors?.name}>
          <Input name="name" required />
        </Field>
        <Field
          label="رقم الجوال"
          hint="مثال: 0512345678"
          error={state.fieldErrors?.phone}
        >
          <Input name="phone" inputMode="tel" placeholder="05xxxxxxxx" required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="السجل التجاري" error={state.fieldErrors?.crNumber}>
          <Input name="crNumber" placeholder="اختياري" />
        </Field>
        <Field label="الرقم الضريبي" error={state.fieldErrors?.vatNumber}>
          <Input name="vatNumber" placeholder="اختياري" />
        </Field>
      </div>

      <RegionCitySelect
        regionError={state.fieldErrors?.region}
        cityError={state.fieldErrors?.city}
      />

      <Field label="نبذة عن المنشأة" error={state.fieldErrors?.description}>
        <Textarea
          name="description"
          placeholder="نوع المواد التي توفرها، مجالات التخصص، سنوات الخبرة..."
        />
      </Field>

      <Field label="البريد الإلكتروني" error={state.fieldErrors?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Field>

      <Field
        label="كلمة المرور"
        hint="8 أحرف على الأقل"
        error={state.fieldErrors?.password}
      >
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>

      <SubmitButton className="w-full">تسجيل المنشأة</SubmitButton>

      <p className="text-center text-xs text-zinc-500">
        سيتم مراجعة طلبك من فريق بنيان قبل ظهور منشأتك في الدليل.
      </p>
      <p className="text-center text-sm text-zinc-500">
        لديك حساب؟{" "}
        <Link href="/login" className="font-medium text-teal-700">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}
