"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { materialSchema } from "@/lib/validation";
import { UNITS } from "@/lib/constants";
import {
  IMAGE_MAX_BYTES,
  IMAGE_MAX_LABEL,
  IMAGE_TYPES,
  materialImagePath,
} from "@/lib/images";
import { type ActionState, toFieldErrors } from "@/lib/action-state";

function parseMaterial(formData: FormData) {
  return materialSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? "",
    unit: formData.get("unit"),
    price: formData.get("price"),
    minOrderQty: formData.get("minOrderQty") || 1,
    stock: formData.get("stock") || undefined,
    city: formData.get("city"),
    region: formData.get("region"),
  });
}

type PickedImage = { file: File | null; error: string | null };

async function readImage(formData: FormData): Promise<PickedImage> {
  const value = formData.get("image");
  if (!(value instanceof File) || value.size === 0) {
    return { file: null, error: null };
  }
  if (!IMAGE_TYPES.includes(value.type as (typeof IMAGE_TYPES)[number])) {
    return { file: null, error: "صيغة الصورة غير مدعومة (JPG أو PNG أو WebP أو GIF)" };
  }
  if (value.size > IMAGE_MAX_BYTES) {
    return { file: null, error: `حجم الصورة يجب أن يكون أقل من ${IMAGE_MAX_LABEL}` };
  }
  return { file: value, error: null };
}

async function imageFields(file: File, materialId: string) {
  return {
    imageData: Buffer.from(await file.arrayBuffer()),
    imageMime: file.type,
    imageUrl: materialImagePath(materialId, Date.now()),
  };
}

export async function createMaterial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = parseMaterial(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const image = await readImage(formData);
  if (image.error) return { fieldErrors: { image: [image.error] } };

  const d = parsed.data;
  if (!UNITS.includes(d.unit)) {
    return { fieldErrors: { unit: ["وحدة قياس غير صالحة"] } };
  }
  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!category) return { fieldErrors: { categoryId: ["التصنيف غير موجود"] } };

  const material = await prisma.material.create({
    data: {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      price: d.price,
      minOrderQty: d.minOrderQty,
      stock: d.stock ?? null,
      city: d.city,
      region: d.region,
    },
  });

  if (image.file) {
    await prisma.material.update({
      where: { id: material.id },
      data: await imageFields(image.file, material.id),
    });
  }

  revalidatePath("/admin/materials");
  revalidatePath("/materials");
  redirect("/admin/materials");
}

export async function updateMaterial(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const existing = await prisma.material.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "المنتج غير موجود" };

  const parsed = parseMaterial(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const image = await readImage(formData);
  if (image.error) return { fieldErrors: { image: [image.error] } };

  const d = parsed.data;
  if (!UNITS.includes(d.unit)) {
    return { fieldErrors: { unit: ["وحدة قياس غير صالحة"] } };
  }
  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!category) return { fieldErrors: { categoryId: ["التصنيف غير موجود"] } };

  const removeImage = formData.get("removeImage") === "on";

  await prisma.material.update({
    where: { id },
    data: {
      categoryId: d.categoryId,
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      price: d.price,
      minOrderQty: d.minOrderQty,
      stock: d.stock ?? null,
      city: d.city,
      region: d.region,
      ...(image.file
        ? await imageFields(image.file, id)
        : removeImage
          ? { imageData: null, imageMime: null, imageUrl: null }
          : {}),
    },
  });

  revalidatePath("/admin/materials");
  revalidatePath("/materials");
  redirect("/admin/materials");
}

export async function toggleMaterialActive(id: string): Promise<void> {
  await requireRole("ADMIN");

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return;

  await prisma.material.update({
    where: { id },
    data: { isActive: !material.isActive },
  });
  revalidatePath("/admin/materials");
  revalidatePath("/materials");
}

export async function deleteMaterial(id: string): Promise<void> {
  await requireRole("ADMIN");

  await prisma.material.deleteMany({ where: { id } });
  revalidatePath("/admin/materials");
  revalidatePath("/materials");
}
