"use client";

import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { emptyActionState } from "@/lib/action-state";
import { Alert } from "@/components/alert";
import { Field, Input, Select, Textarea } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { RegionCitySelect } from "@/components/forms/region-city-select";
import { UNIT_LABELS, UNITS } from "@/lib/constants";
import {
  IMAGE_ACCEPT,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_LABEL,
  IMAGE_TYPES,
} from "@/lib/images";

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

/** Shrink large photos in the browser so uploads stay under the action limit. */
async function downscale(file: File): Promise<File | null> {
  if (file.size <= 1.5 * 1024 * 1024) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return null;

    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return null;
  }
}

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
  const imageInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    defaults?.imageUrl ?? null,
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [removeImage, setRemoveImage] = useState(false);

  async function onPickImage(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const picked = input.files?.[0];
    setImageError(null);
    if (!picked) return;

    if (!IMAGE_TYPES.includes(picked.type as (typeof IMAGE_TYPES)[number])) {
      setImageError("صيغة الصورة غير مدعومة (JPG أو PNG أو WebP أو GIF)");
      input.value = "";
      return;
    }

    setPreparing(true);
    try {
      const resized = await downscale(picked);
      const file = resized ?? picked;

      if (file.size > IMAGE_MAX_BYTES) {
        setImageError(`حجم الصورة يجب أن يكون أقل من ${IMAGE_MAX_LABEL}`);
        input.value = "";
        return;
      }

      if (resized && typeof DataTransfer !== "undefined" && imageInput.current) {
        const transfer = new DataTransfer();
        transfer.items.add(resized);
        imageInput.current.files = transfer.files;
      }

      setPreview(URL.createObjectURL(file));
      setRemoveImage(false);
    } finally {
      setPreparing(false);
    }
  }

  const imageErrors = imageError
    ? [imageError]
    : state.fieldErrors?.image;

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

      <Field
        label="صورة المنتج"
        hint={`ارفع صورة من جهازك (حتى ${IMAGE_MAX_LABEL})`}
        error={imageErrors}
      >
        <div className="space-y-3">
          {preview && !removeImage ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="معاينة صورة المنتج"
                className="h-24 w-24 rounded-xl border border-zinc-200 object-cover"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  name="removeImage"
                  checked={removeImage}
                  onChange={(event) => {
                    setRemoveImage(event.currentTarget.checked);
                    if (event.currentTarget.checked && imageInput.current) {
                      imageInput.current.value = "";
                    }
                  }}
                  className="h-4 w-4"
                />
                إزالة الصورة الحالية
              </label>
            </div>
          ) : removeImage ? (
            <p className="text-sm text-zinc-500">
              ستُزال الصورة عند الحفظ.
            </p>
          ) : null}

          <input
            ref={imageInput}
            type="file"
            name="image"
            accept={IMAGE_ACCEPT}
            onChange={onPickImage}
            className="block w-full cursor-pointer rounded-xl border border-dashed border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-500 hover:border-teal-600"
          />
          {preparing ? (
            <p className="text-xs text-zinc-500">جارٍ تجهيز الصورة...</p>
          ) : null}
        </div>
      </Field>

      <Field label="الوصف" error={state.fieldErrors?.description}>
        <Textarea name="description" defaultValue={defaults?.description} />
      </Field>

      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
