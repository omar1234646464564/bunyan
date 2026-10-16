"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/dal";
import { type ActionState } from "@/lib/action-state";

export async function sendMessage(
  orderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { fieldErrors: { body: ["الرسالة فارغة"] } };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });
  if (!order) return { error: "الطلب غير موجود" };

  const isCustomer = order.customerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isCustomer && !isAdmin) {
    return { error: "غير مصرّح بإرسال رسائل على هذا الطلب" };
  }

  const receiverId = isCustomer ? null : order.customerId;

  await prisma.message.create({
    data: { orderId, senderId: user.id, receiverId, body },
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: "تم إرسال الرسالة" };
}
