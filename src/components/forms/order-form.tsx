"use client";

import { useActionState, useState } from "react";
import { createOrder } from "@/actions/orders";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { SAUDI_CITIES, VAT_RATE } from "@/lib/constants";
import { formatSAR } from "@/lib/format";

export function OrderForm({
  materialId,
  unitLabel,
  unitPrice,
  minOrderQty,
  maxQty,
  defaultCity,
  defaultPhone,
}: {
  materialId: string;
  unitLabel: string;
  unitPrice: number;
  minOrderQty: number;
  maxQty?: number | null;
  defaultCity?: string;
  defaultPhone?: string;
}) {
  const [state, action] = useActionState(createOrder, emptyActionState);
  const [quantity, setQuantity] = useState(minOrderQty);

  const subtotal = Math.round(unitPrice * (quantity || 0) * 100) / 100;
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="materialId" value={materialId} />

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={`الكمية (${unitLabel})`}
          hint={`أدنى كمية ${minOrderQty}${maxQty != null ? ` — المتاح ${maxQty}` : ""}`}
          error={state.fieldErrors?.quantity}
        >
          <Input
            name="quantity"
            type="number"
            min={minOrderQty}
            max={maxQty ?? undefined}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </Field>
        <Field label="رقم التواصل" error={state.fieldErrors?.contactPhone}>
          <Input
            name="contactPhone"
            inputMode="tel"
            defaultValue={defaultPhone}
            placeholder="05xxxxxxxx"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="مدينة التسليم" error={state.fieldErrors?.deliveryCity}>
          <Select name="deliveryCity" defaultValue={defaultCity ?? ""} required>
            <option value="">اختر المدينة</option>
            {SAUDI_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="تاريخ التسليم المطلوب" error={state.fieldErrors?.deliveryDate}>
          <Input name="deliveryDate" type="date" />
        </Field>
      </div>

      <Field label="عنوان التسليم" error={state.fieldErrors?.deliveryAddress}>
        <Input
          name="deliveryAddress"
          placeholder="الحي، الشارع، رقم المبنى"
        />
      </Field>

      <Field label="ملاحظات" error={state.fieldErrors?.notes}>
        <Textarea name="notes" placeholder="أي تفاصيل إضافية لفريقنا..." />
      </Field>

      <div className="rounded-xl bg-zinc-50 p-4 text-sm">
        <div className="flex justify-between text-zinc-600">
          <span>المجموع الفرعي</span>
          <span>{formatSAR(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-zinc-600">
          <span>ضريبة القيمة المضافة (15%)</span>
          <span>{formatSAR(vat)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
          <span>الإجمالي</span>
          <span>{formatSAR(total)}</span>
        </div>
      </div>

      <SubmitButton className="w-full" pendingText="جارٍ إرسال الطلب...">
        إرسال الطلب
      </SubmitButton>
    </form>
  );
}
