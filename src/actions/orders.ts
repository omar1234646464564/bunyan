"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { calcVat, orderNumber, toNumber } from "@/lib/format";
import { ORDER_STATUS_NEXT, ORDER_STATUS_CANCELLABLE } from "@/lib/constants";
import { type ActionState } from "@/lib/action-state";

const saudiPhone = /^(?:\+9665|05)\d{8}$/;

class OutOfStockError extends Error {}

export async function createOrder(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("CUSTOMER");

  const materialId = String(formData.get("materialId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const deliveryCity = String(formData.get("deliveryCity") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();
  const deliveryDateRaw = String(formData.get("deliveryDate") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });

  if (!material || !material.isActive) {
    return { error: "المادة غير متوفرة حالياً" };
  }
  if (!Number.isInteger(quantity) || quantity < material.minOrderQty) {
    return {
      fieldErrors: {
        quantity: [`الحد الأدنى للطلب ${material.minOrderQty}`],
      },
    };
  }
  if (material.stock !== null && quantity > material.stock) {
    return { fieldErrors: { quantity: ["الكمية المطلوبة تتجاوز المخزون المتاح"] } };
  }
  if (!deliveryCity) {
    return { fieldErrors: { deliveryCity: ["مدينة التسليم مطلوبة"] } };
  }
  if (contactPhone && !saudiPhone.test(contactPhone)) {
    return {
      fieldErrors: { contactPhone: ["رقم جوال سعودي غير صالح (مثال 05xxxxxxxx)"] },
    };
  }
  if (notes.length > 2000) {
    return { fieldErrors: { notes: ["الملاحظات طويلة جداً"] } };
  }

  let deliveryDate: Date | null = null;
  if (deliveryDateRaw) {
    const parsed = new Date(deliveryDateRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { fieldErrors: { deliveryDate: ["تاريخ تسليم غير صالح"] } };
    }
    deliveryDate = parsed;
  }

  const unitPrice = toNumber(material.price);
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const vat = calcVat(subtotal);
  const total = Math.round((subtotal + vat) * 100) / 100;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      if (material.stock !== null) {
        const reserved = await tx.material.updateMany({
          where: { id: material.id, isActive: true, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (reserved.count === 0) throw new OutOfStockError();
      }

      return tx.order.create({
        data: {
          number: orderNumber(),
          customerId: user.id,
          subtotal,
          vat,
          total,
          deliveryCity,
          deliveryAddress: deliveryAddress || null,
          deliveryDate,
          contactPhone: contactPhone || user.phone || null,
          notes: notes || null,
          items: {
            create: [
              {
                materialId: material.id,
                name: material.name,
                unit: material.unit,
                quantity,
                unitPrice,
                lineTotal: subtotal,
              },
            ],
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      return {
        fieldErrors: { quantity: ["الكمية المطلوبة تتجاوز المخزون المتاح"] },
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/materials/${material.id}`);
  redirect(`/dashboard/orders/${order.id}`);
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  await requireRole("ADMIN");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  const isCancel = status === "CANCELLED";

  // Admins may advance the flow or cancel an order, but may never set
  // PENDING/CONFIRMED here (handled by the accept action).
  if (!isCancel) {
    if (ORDER_STATUS_NEXT[order.status] !== status) return;
  } else if (!ORDER_STATUS_CANCELLABLE.includes(order.status)) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status } });
    if (isCancel) {
      await restoreOrderStock(tx, orderId);
    }
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/materials");
}

export async function cancelOrder(orderId: string): Promise<void> {
  const user = await requireRole("CUSTOMER");

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, customerId: user.id, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (updated.count === 0) return false;

    await restoreOrderStock(tx, orderId);
    return true;
  });

  if (!cancelled) return;

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
  revalidatePath("/materials");
}

async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (!item.materialId) continue;
    await tx.material.updateMany({
      where: { id: item.materialId, stock: { not: null } },
      data: { stock: { increment: item.quantity } },
    });
  }
}
