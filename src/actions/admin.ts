"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { slugify, calcVat, toNumber } from "@/lib/format";
import { type ActionState } from "@/lib/action-state";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"];

export async function setSupplierStatus(
  id: string,
  status: string,
): Promise<void> {
  await requireRole("ADMIN");
  if (!STATUSES.includes(status)) return;

  await prisma.supplierProfile.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/suppliers");
  revalidatePath("/suppliers");
  revalidatePath("/materials");
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { fieldErrors: { name: ["اسم التصنيف مطلوب"] } };

  const slug = slugify(String(formData.get("slug") ?? "") || name);

  try {
    await prisma.category.create({
      data: {
        name,
        slug,
        icon: String(formData.get("icon") ?? "").trim() || null,
      },
    });
  } catch {
    return { error: "تعذّر إنشاء التصنيف، قد يكون الاسم مستخدماً" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return { success: "تم إنشاء التصنيف" };
}

export async function deleteCategory(id: string): Promise<void> {
  await requireRole("ADMIN");
  const used = await prisma.material.count({ where: { categoryId: id } });
  if (used > 0) return;

  await prisma.category.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
}

export async function assignSupplier(
  orderId: string,
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const supplierId = String(formData.get("supplierId") ?? "");
  if (!supplierId) return;

  const supplier = await prisma.supplierProfile.findUnique({
    where: { id: supplierId },
  });
  if (!supplier || supplier.status !== "APPROVED") return;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { supplierId, assignedAt: new Date() },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/supplier/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export async function releaseSupplier(orderId: string): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { supplierId: null, assignedAt: null, status: "AWAITING_SUPPLIER" },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/supplier/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

async function recomputeOrderTotals(orderId: string): Promise<void> {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + toNumber(item.lineTotal), 0) * 100,
    ) / 100;
  const vat = calcVat(subtotal);
  const total = Math.round((subtotal + vat) * 100) / 100;

  await prisma.order.update({
    where: { id: orderId },
    data: { subtotal, vat, total },
  });
}

function revalidateOrder(orderId: string): void {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/supplier/orders");
}

export async function acceptOrder(orderId: string): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { _count: { select: { items: true } } },
  });
  if (!order) return;
  if (order.status !== "AWAITING_SUPPLIER") return;
  if (!order.supplierId) return;
  if (order._count.items === 0) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED" },
  });

  revalidateOrder(orderId);
}

export async function addOrderItem(
  orderId: string,
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "AWAITING_SUPPLIER") return;

  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material || !material.isActive) return;
  if (!Number.isInteger(quantity) || quantity < 1) return;

  const unitPrice = toNumber(material.price);
  const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

  await prisma.orderItem.create({
    data: {
      orderId,
      materialId: material.id,
      name: material.name,
      unit: material.unit,
      quantity,
      unitPrice,
      lineTotal,
    },
  });

  await recomputeOrderTotals(orderId);
  revalidateOrder(orderId);
}

export async function updateOrderItem(
  orderId: string,
  itemId: string,
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "AWAITING_SUPPLIER") return;

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item || item.orderId !== orderId) return;

  const quantity = Number(formData.get("quantity") ?? 0);
  if (!Number.isInteger(quantity) || quantity < 1) return;

  const unitPriceRaw = Number(formData.get("unitPrice") ?? "");
  const unitPrice =
    Number.isFinite(unitPriceRaw) && unitPriceRaw >= 0
      ? Math.round(unitPriceRaw * 100) / 100
      : toNumber(item.unitPrice);
  const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

  await prisma.orderItem.update({
    where: { id: itemId },
    data: { quantity, unitPrice, lineTotal },
  });

  await recomputeOrderTotals(orderId);
  revalidateOrder(orderId);
}

export async function removeOrderItem(
  orderId: string,
  itemId: string,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "AWAITING_SUPPLIER") return;

  await prisma.orderItem.deleteMany({ where: { id: itemId, orderId } });
  await recomputeOrderTotals(orderId);
  revalidateOrder(orderId);
}
