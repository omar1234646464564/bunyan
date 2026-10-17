"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { materialSchema } from "@/lib/validation";
import { UNITS } from "@/lib/constants";
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
    imageUrl: formData.get("imageUrl") ?? "",
  });
}

export async function createMaterial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("SUPPLIER");
  const supplier = user.supplier;
  if (!supplier) return { error: "تعذّر العثور على ملف المنشأة" };
  if (supplier.status !== "APPROVED") {
    return { error: "حساب المنشأة غير معتمد. بانتظار موافقة الإدارة." };
  }

  const parsed = parseMaterial(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const d = parsed.data;
  if (!UNITS.includes(d.unit)) {
    return { fieldErrors: { unit: ["وحدة قياس غير صالحة"] } };
  }
  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!category) return { fieldErrors: { categoryId: ["التصنيف غير موجود"] } };

  await prisma.material.create({
    data: {
      supplierId: supplier.id,
      categoryId: d.categoryId,
      name: d.name,
      description: d.description || null,
      unit: d.unit,
      price: d.price,
      minOrderQty: d.minOrderQty,
      stock: d.stock ?? null,
      city: d.city,
      region: d.region,
      imageUrl: d.imageUrl || null,
    },
  });

  revalidatePath("/supplier/materials");
  revalidatePath("/materials");
  redirect("/supplier/materials");
}

export async function updateMaterial(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("SUPPLIER");
  const supplier = user.supplier;
  if (!supplier) return { error: "تعذّر العثور على ملف المنشأة" };
  if (supplier.status !== "APPROVED") {
    return { error: "حساب المنشأة غير معتمد. بانتظار موافقة الإدارة." };
  }

  const owned = await prisma.material.findFirst({
    where: { id, supplierId: supplier.id },
  });
  if (!owned) return { error: "المادة غير موجودة" };

  const parsed = parseMaterial(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const d = parsed.data;
  if (!UNITS.includes(d.unit)) {
    return { fieldErrors: { unit: ["وحدة قياس غير صالحة"] } };
  }
  const category = await prisma.category.findUnique({
    where: { id: d.categoryId },
    select: { id: true },
  });
  if (!category) return { fieldErrors: { categoryId: ["التصنيف غير موجود"] } };

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
      imageUrl: d.imageUrl || null,
    },
  });

  revalidatePath("/supplier/materials");
  revalidatePath("/materials");
  redirect("/supplier/materials");
}

export async function toggleMaterialActive(id: string): Promise<void> {
  const user = await requireRole("SUPPLIER");
  const supplier = user.supplier;
  if (!supplier) return;

  const material = await prisma.material.findFirst({
    where: { id, supplierId: supplier.id },
  });
  if (!material) return;

  await prisma.material.update({
    where: { id },
    data: { isActive: !material.isActive },
  });
  revalidatePath("/supplier/materials");
  revalidatePath("/materials");
}

export async function deleteMaterial(id: string): Promise<void> {
  const user = await requireRole("SUPPLIER");
  const supplier = user.supplier;
  if (!supplier) return;

  await prisma.material.deleteMany({ where: { id, supplierId: supplier.id } });
  revalidatePath("/supplier/materials");
  revalidatePath("/materials");
}
