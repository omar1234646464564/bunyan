"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { supplierProfileSchema } from "@/lib/validation";
import { type ActionState, toFieldErrors } from "@/lib/action-state";

export async function updateSupplierProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("SUPPLIER");
  const supplier = user.supplier;
  if (!supplier) return { error: "تعذّر العثور على ملف المنشأة" };

  const parsed = supplierProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    phone: formData.get("phone") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    city: formData.get("city"),
    region: formData.get("region"),
    address: formData.get("address") ?? "",
    description: formData.get("description") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
  });

  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const d = parsed.data;
  await prisma.supplierProfile.update({
    where: { id: supplier.id },
    data: {
      companyName: d.companyName,
      phone: d.phone || null,
      whatsapp: d.whatsapp || null,
      city: d.city,
      region: d.region,
      address: d.address || null,
      description: d.description || null,
      logoUrl: d.logoUrl || null,
    },
  });

  revalidatePath("/supplier/profile");
  revalidatePath(`/suppliers/${supplier.slug}`);
  return { success: "تم حفظ بيانات المنشأة بنجاح" };
}

export async function updateContactName(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("SUPPLIER", "CUSTOMER");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) {
    return { fieldErrors: { name: ["الاسم مطلوب"] } };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/supplier/profile");
  revalidatePath("/dashboard");
  return { success: "تم تحديث الاسم" };
}
