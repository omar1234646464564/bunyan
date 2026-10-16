"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { calcVat, orderNumber, toNumber } from "@/lib/format";
import { ORDER_STATUS_FLOW } from "@/lib/constants";
import { type ActionState } from "@/lib/action-state";

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
    include: { supplier: true },
  });

  if (!material || !material.isActive) {
    return { error: "المادة غير متوفرة حالياً" };
  }
  if (material.supplier.status !== "APPROVED") {
    return { error: "هذا المورد غير معتمد حالياً" };
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

  const unitPrice = toNumber(material.price);
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const vat = calcVat(subtotal);
  const total = Math.round((subtotal + vat) * 100) / 100;

  let deliveryDate: Date | null = null;
  if (deliveryDateRaw) {
    const parsed = new Date(deliveryDateRaw);
    if (!Number.isNaN(parsed.getTime())) deliveryDate = parsed;
  }

  const order = await prisma.order.create({
    data: {
      number: orderNumber(),
      customerId: user.id,
      requestedSupplierName: material.supplier.companyName,
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

  revalidatePath("/dashboard/orders");
  redirect(`/dashboard/orders/${order.id}`);
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
): Promise<void> {
  const user = await requireRole("SUPPLIER", "ADMIN");
  if (status !== "CANCELLED" && !ORDER_STATUS_FLOW.includes(status as never)) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) return;
  if (user.role === "SUPPLIER") {
    if (!user.supplier || order.supplierId !== user.supplier.id) return;
    if (!["PROCESSING", "SHIPPED", "DELIVERED"].includes(status)) return;
    if (order.status === "AWAITING_SUPPLIER") return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath(`/supplier/orders/${orderId}`);
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/supplier/orders");
  revalidatePath("/dashboard/orders");
  revalidatePath("/admin/orders");
}

export async function cancelOrder(orderId: string): Promise<void> {
  const user = await requireRole("CUSTOMER");

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: user.id, status: "AWAITING_SUPPLIER" },
  });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}
