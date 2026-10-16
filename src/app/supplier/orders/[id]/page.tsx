import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapPin, Calendar, Phone, User } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/actions/orders";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrderStatusBadge } from "@/components/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderItems } from "@/components/order-items";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata = { title: "تفاصيل الطلب" };

export default async function SupplierOrderDetailPage({
  params,
}: PageProps<"/supplier/orders/[id]">) {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, supplierId: supplier.id, status: { not: "AWAITING_SUPPLIER" } },
    include: {
      items: true,
      customer: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) notFound();

  const statusOptions = ORDER_STATUS_FLOW.filter(
    (status) => status !== "AWAITING_SUPPLIER" && status !== "CONFIRMED",
  );

  return (
    <div>
      <Link href="/supplier/orders" className="text-sm font-medium text-teal-700">
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تحديث حالة الطلب</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <form
                key={status}
                action={updateOrderStatus.bind(null, order.id, status)}
              >
                <SubmitButton
                  variant={order.status === status ? "primary" : "outline"}
                  size="sm"
                  pendingText="..."
                >
                  {ORDER_STATUS_LABELS[status]}
                </SubmitButton>
              </form>
            ))}
            {order.status !== "CANCELLED" ? (
              <form action={updateOrderStatus.bind(null, order.id, "CANCELLED")}>
                <SubmitButton variant="danger" size="sm" pendingText="...">
                  إلغاء
                </SubmitButton>
              </form>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardBody>
              <OrderItems
                items={order.items}
                subtotal={order.subtotal}
                vat={order.vat}
                total={order.total}
              />
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
                <p className="whitespace-pre-line">{order.notes}</p>
              ) : null}
            </CardBody>
          </Card>

          <Link
            href={`/materials/${order.items[0]?.materialId ?? ""}`}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            عرض المادة
          </Link>
        </div>
      </div>
    </div>
  );
}
