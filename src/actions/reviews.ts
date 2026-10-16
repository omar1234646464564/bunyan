"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/dal";
import { reviewSchema } from "@/lib/validation";
import { type ActionState, toFieldErrors } from "@/lib/action-state";

export async function createReview(
  orderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("CUSTOMER");

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: user.id },
    include: { review: true },
  });
  if (!order) return { error: "الطلب غير موجود" };
  if (order.status !== "DELIVERED") {
    return { error: "يمكن التقييم بعد تسليم الطلب فقط" };
  }
  if (order.review) return { error: "تم تقييم هذا الطلب مسبقاً" };
  if (!order.supplierId) {
    return { error: "لم يتم تعيين مورد لهذا الطلب بعد" };
  }

  await prisma.$transaction([
    prisma.review.create({
      data: {
        orderId,
        supplierId: order.supplierId,
        customerId: user.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment || null,
      },
    }),
    prisma.supplierProfile.update({
      where: { id: order.supplierId },
      data: {
        ratingSum: { increment: parsed.data.rating },
        ratingCount: { increment: 1 },
      },
    }),
  ]);

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/suppliers");
  return { success: "شكراً لتقييمك" };
}
