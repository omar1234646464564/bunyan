"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { slugify, calcVat, toNumber } from "@/lib/format";
import { type ActionState } from "@/lib/action-state";

class OutOfStockError extends Error {}

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

async function recomputeOrderTotals(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  const subtotal =
    Math.round(
      items.reduce((sum, item) => sum + toNumber(item.lineTotal), 0) * 100,
    ) / 100;
  const vat = calcVat(subtotal);
  const total = Math.round((subtotal + vat) * 100) / 100;

  await tx.order.update({
    where: { id: orderId },
    data: { subtotal, vat, total },
  });
}

function revalidateOrder(orderId: string): void {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export async function acceptOrder(orderId: string): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { _count: { select: { items: true } } },
  });
  if (!order) return;
  if (order.status !== "PENDING") return;
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
  if (!order || order.status !== "PENDING") return;

  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  if (!material || !material.isActive) return;
  if (!Number.isInteger(quantity) || quantity < material.minOrderQty) return;
  if (material.stock !== null && quantity > material.stock) return;

  const unitPrice = toNumber(material.price);
  const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

  try {
    await prisma.$transaction(async (tx) => {
      if (material.stock !== null) {
        const reserved = await tx.material.updateMany({
          where: { id: material.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (reserved.count === 0) throw new OutOfStockError();
      }

      await tx.orderItem.create({
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

      await recomputeOrderTotals(tx, orderId);
    });
  } catch (error) {
    if (error instanceof OutOfStockError) return;
    throw error;
  }

  revalidateOrder(orderId);
}

export async function updateOrderItem(
  orderId: string,
  itemId: string,
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return;

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
  if (!item || item.orderId !== orderId) return;

  const quantity = Number(formData.get("quantity") ?? 0);
  if (!Number.isInteger(quantity) || quantity < 1) return;

  const unitPriceRaw = formData.get("unitPrice");
  const hasUnitPrice =
    unitPriceRaw !== null && String(unitPriceRaw).trim() !== "";
  const parsedUnitPrice = hasUnitPrice ? Number(unitPriceRaw) : NaN;
  if (hasUnitPrice && (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0)) {
    return;
  }
  const unitPrice = hasUnitPrice
    ? Math.round(parsedUnitPrice * 100) / 100
    : toNumber(item.unitPrice);
  const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

  const delta = quantity - item.quantity;
  const material = item.materialId
    ? await prisma.material.findUnique({ where: { id: item.materialId } })
    : null;

  try {
    await prisma.$transaction(async (tx) => {
      if (material && material.stock !== null) {
        if (delta > 0) {
          const reserved = await tx.material.updateMany({
            where: { id: material.id, stock: { gte: delta } },
            data: { stock: { decrement: delta } },
          });
          if (reserved.count === 0) throw new OutOfStockError();
        } else if (delta < 0) {
          await tx.material.updateMany({
            where: { id: material.id, stock: { not: null } },
            data: { stock: { increment: -delta } },
          });
        }
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { quantity, unitPrice, lineTotal },
      });

      await recomputeOrderTotals(tx, orderId);
    });
  } catch (error) {
    if (error instanceof OutOfStockError) return;
    throw error;
  }

  revalidateOrder(orderId);
}

export async function removeOrderItem(
  orderId: string,
  itemId: string,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.findUnique({ where: { id: itemId } });
    if (!item || item.orderId !== orderId) return;

    await tx.orderItem.delete({ where: { id: itemId } });

    if (item.materialId) {
      await tx.material.updateMany({
        where: { id: item.materialId, stock: { not: null } },
        data: { stock: { increment: item.quantity } },
      });
    }

    await recomputeOrderTotals(tx, orderId);
  });

  revalidateOrder(orderId);
}
