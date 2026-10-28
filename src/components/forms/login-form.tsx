"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="البريد الإلكتروني" error={state.fieldErrors?.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="كلمة المرور" error={state.fieldErrors?.password}>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </Field>

      <SubmitButton className="w-full">دخول</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        لا تملك حساباً؟{" "}
        <Link href="/register" className="font-medium text-teal-700">
          أنشئ حساباً جديداً
        </Link>
      </p>
    </form>
  );
}
