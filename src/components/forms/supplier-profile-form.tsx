"use client";

import { useActionState } from "react";
import { updateSupplierProfile } from "@/actions/supplier";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { RegionCitySelect } from "@/components/forms/region-city-select";

export function SupplierProfileForm({
  defaults,
}: {
  defaults: {
    companyName: string;
    phone?: string | null;
    whatsapp?: string | null;
    city: string;
    region: string;
    address?: string | null;
    description?: string | null;
    logoUrl?: string | null;
  };
}) {
  const [state, action] = useActionState(updateSupplierProfile, emptyActionState);

  return (
    <form action={action} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {state.success ? <Alert variant="success">{state.success}</Alert> : null}

      <Field label="اسم المنشأة" error={state.fieldErrors?.companyName}>
        <Input name="companyName" defaultValue={defaults.companyName} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="رقم الجوال" error={state.fieldErrors?.phone}>
          <Input name="phone" defaultValue={defaults.phone ?? ""} inputMode="tel" />
        </Field>
        <Field label="واتساب" error={state.fieldErrors?.whatsapp}>
          <Input
            name="whatsapp"
            defaultValue={defaults.whatsapp ?? ""}
            inputMode="tel"
          />
        </Field>
      </div>

      <RegionCitySelect
        defaultRegion={defaults.region}
        defaultCity={defaults.city}
        regionError={state.fieldErrors?.region}
        cityError={state.fieldErrors?.city}
      />

      <Field label="العنوان" error={state.fieldErrors?.address}>
        <Input name="address" defaultValue={defaults.address ?? ""} />
      </Field>

      <Field label="رابط الشعار" error={state.fieldErrors?.logoUrl}>
        <Input name="logoUrl" defaultValue={defaults.logoUrl ?? ""} placeholder="https://..." />
      </Field>

      <Field label="نبذة عن المنشأة" error={state.fieldErrors?.description}>
        <Textarea name="description" defaultValue={defaults.description ?? ""} />
      </Field>

      <SubmitButton>حفظ التغييرات</SubmitButton>
    </form>
  );
}
