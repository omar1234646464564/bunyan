"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { RegionCitySelect } from "@/components/forms/region-city-select";
import { UNIT_LABELS, UNITS } from "@/lib/constants";

export type MaterialDefaults = {
  name?: string;
  categoryId?: string;
  description?: string;
  unit?: string;
  price?: number | string;
  minOrderQty?: number;
  stock?: number | null;
  city?: string;
  region?: string;
  imageUrl?: string;
};

export function MaterialForm({
  action,
  categories,
  defaults,
  submitLabel = "حفظ المنتج",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: { id: string; name: string }[];
  defaults?: MaterialDefaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="اسم المنتج" error={state.fieldErrors?.name}>
        <Input name="name" defaultValue={defaults?.name} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="التصنيف" error={state.fieldErrors?.categoryId}>
          <Select name="categoryId" defaultValue={defaults?.categoryId ?? ""} required>
            <option value="">اختر التصنيف</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="وحدة القياس" error={state.fieldErrors?.unit}>
          <Select name="unit" defaultValue={defaults?.unit ?? "PIECE"} required>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {UNIT_LABELS[u]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="السعر (ر.س)"
          hint="السعر قبل الضريبة"
          error={state.fieldErrors?.price}
        >
          <Input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.price}
            required
          />
        </Field>
        <Field label="أدنى كمية للطلب" error={state.fieldErrors?.minOrderQty}>
          <Input
            name="minOrderQty"
            type="number"
            min="1"
            defaultValue={defaults?.minOrderQty ?? 1}
            required
          />
        </Field>
        <Field
          label="المخزون المتاح"
          hint="اتركه فارغاً إذا كان غير محدود"
          error={state.fieldErrors?.stock}
        >
          <Input
            name="stock"
            type="number"
            min="0"
            defaultValue={defaults?.stock ?? ""}
          />
        </Field>
      </div>

      <RegionCitySelect
        defaultRegion={defaults?.region}
        defaultCity={defaults?.city}
        regionError={state.fieldErrors?.region}
        cityError={state.fieldErrors?.city}
      />

      <Field label="رابط صورة المنتج" error={state.fieldErrors?.imageUrl}>
        <Input
          name="imageUrl"
          placeholder="https://..."
          defaultValue={defaults?.imageUrl}
        />
      </Field>

      <Field label="الوصف" error={state.fieldErrors?.description}>
        <Textarea name="description" defaultValue={defaults?.description} />
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
