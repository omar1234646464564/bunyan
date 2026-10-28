import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Phone, User, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import {
  acceptOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
} from "@/actions/admin";
import { updateOrderStatus } from "@/actions/orders";
import { sendMessage } from "@/actions/messages";
import { Card, CardHeader, CardTitle, CardBody, Badge } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Select, Label, Input } from "@/components/ui/fields";
import { OrderStatusBadge } from "@/components/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderItems } from "@/components/order-items";
import { MessageThread } from "@/components/message-thread";
import { MessageForm } from "@/components/forms/message-form";
import {
  ORDER_STATUS_NEXT,
  ORDER_STATUS_CANCELLABLE,
  ORDER_STATUS_LABELS,
  UNIT_LABELS,
} from "@/lib/constants";
import { formatDate, formatSAR, toNumber } from "@/lib/format";

export const metadata = { title: "تفاصيل الطلب" };

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const user = await requireRole("ADMIN");

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { name: true, email: true, phone: true } },
      messages: {
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true },
  });

  const editable = order.status === "PENDING";
  const canAccept = order.items.length > 0;
  const nextStatus = ORDER_STATUS_NEXT[order.status];
  const canCancel = ORDER_STATUS_CANCELLABLE.includes(order.status);

  const sendAction = sendMessage.bind(null, order.id);

  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-medium text-teal-700">
        ← كل الطلبات
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-zinc-900">
            {order.number}
            <OrderStatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            بتاريخ {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <OrderTimeline status={order.status} />
      </div>

      {order.status === "PENDING" ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-700" />
              قبول الطلب
            </CardTitle>
          </CardHeader>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {order.items.length === 0
                ? "أضف صنفاً واحداً على الأقل قبل القبول."
                : "راجع الأصناف ثم اقبل الطلب لبدء التنفيذ."}
            </p>
            {canAccept ? (
              <form action={acceptOrder.bind(null, order.id)}>
                <SubmitButton pendingText="...">قبول الطلب</SubmitButton>
              </form>
            ) : null}
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>تحديث حالة الطلب</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {nextStatus ? (
                <form
                  action={updateOrderStatus.bind(null, order.id, nextStatus)}
                >
                  <SubmitButton pendingText="...">
                    {ORDER_STATUS_LABELS[nextStatus]}
                  </SubmitButton>
                </form>
              ) : null}
              {canCancel ? (
                <form action={updateOrderStatus.bind(null, order.id, "CANCELLED")}>
                  <SubmitButton variant="danger" size="sm" pendingText="...">
                    إلغاء
                  </SubmitButton>
                </form>
              ) : null}
              {!nextStatus && !canCancel ? (
                <p className="text-sm text-zinc-500">
                  لا توجد إجراءات متاحة لهذا الطلب.
                </p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الأصناف</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {editable ? (
                <>
                  {order.items.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      لا توجد أصناف بعد — أضف أول صنف للطلب.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-100 p-3"
                        >
                          <form
                            action={updateOrderItem.bind(null, order.id, item.id)}
                            className="flex flex-1 flex-wrap items-end gap-3"
                          >
                            <div className="min-w-40 flex-1">
                              <p className="text-sm font-medium text-zinc-800">
                                {item.name}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {UNIT_LABELS[item.unit] ?? item.unit}
                              </p>
                            </div>
                            <Input
                              type="number"
                              name="quantity"
                              min={1}
                              step={1}
                              defaultValue={item.quantity}
                              aria-label="الكمية"
                              className="w-24"
                            />
                            <Input
                              type="number"
                              name="unitPrice"
                              min={0}
                              step="0.01"
                              defaultValue={toNumber(item.unitPrice)}
                              aria-label="سعر الوحدة"
                              className="w-28"
                            />
                            <SubmitButton
                              size="sm"
                              variant="outline"
                              pendingText="..."
                            >
                              حفظ
                            </SubmitButton>
                          </form>
                          <form action={removeOrderItem.bind(null, order.id, item.id)}>
                            <SubmitButton size="sm" variant="ghost" pendingText="...">
                              حذف
                            </SubmitButton>
                          </form>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1 border-t border-zinc-100 pt-4 text-sm">
                    <div className="flex justify-between text-zinc-600">
                      <span>المجموع الفرعي</span>
                      <span>{formatSAR(toNumber(order.subtotal))}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>ضريبة القيمة المضافة (15%)</span>
                      <span>{formatSAR(toNumber(order.vat))}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900">
                      <span>الإجمالي</span>
                      <span>{formatSAR(toNumber(order.total))}</span>
                    </div>
                  </div>

                  <form
                    action={addOrderItem.bind(null, order.id)}
                    className="flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-4"
                  >
                    <div className="min-w-56 flex-1">
                      <Label htmlFor="materialId">إضافة صنف</Label>
                      <Select id="materialId" name="materialId" defaultValue="" required>
                        <option value="" disabled>
                          — اختر المنتج —
                        </option>
                        {materials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} ({UNIT_LABELS[material.unit] ?? material.unit})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="w-28">
                      <Label htmlFor="itemQuantity">الكمية</Label>
                      <Input
                        id="itemQuantity"
                        name="quantity"
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={1}
                        required
                      />
                    </div>
                    <SubmitButton pendingText="...">إضافة</SubmitButton>
                  </form>
                </>
              ) : (
                <OrderItems
                  items={order.items}
                  subtotal={order.subtotal}
                  vat={order.vat}
                  total={order.total}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>المحادثة مع العميل</CardTitle>
            </CardHeader>
            <CardBody>
              <MessageThread messages={order.messages} currentUserId={user.id} />
              <div className="mt-3 border-t border-zinc-100 pt-3">
                <MessageForm action={sendAction} />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>العميل</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-zinc-600">
              <p className="flex items-center gap-2 font-medium text-zinc-900">
                <User className="h-4 w-4" />
                {order.customer.name}
              </p>
              {order.customer.phone ? (
                <a
                  href={`tel:${order.customer.phone}`}
                  className="flex items-center gap-2 hover:text-teal-700"
                >
                  <Phone className="h-4 w-4" />
                  {order.customer.phone}
                </a>
              ) : null}
              <p className="text-xs text-zinc-400">{order.customer.email}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>التسليم</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm text-zinc-600">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {order.deliveryCity}
                {order.deliveryAddress ? ` — ${order.deliveryAddress}` : ""}
              </p>
              {order.deliveryDate ? (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(order.deliveryDate)}
                </p>
              ) : null}
              {order.contactPhone ? (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {order.contactPhone}
                </p>
              ) : null}
              {order.notes ? (
                <div>
                  <Badge className="bg-zinc-100 text-zinc-600">ملاحظات</Badge>
                  <p className="mt-2 whitespace-pre-line">{order.notes}</p>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
