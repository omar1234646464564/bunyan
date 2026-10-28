import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MapPin, Calendar, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { cancelOrder } from "@/actions/orders";
import { sendMessage } from "@/actions/messages";
import { Card, CardHeader, CardTitle, CardBody, Badge } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { OrderStatusBadge } from "@/components/status-badge";
import { OrderTimeline } from "@/components/order-timeline";
import { OrderItems } from "@/components/order-items";
import { MessageThread } from "@/components/message-thread";
import { MessageForm } from "@/components/forms/message-form";
import { formatDate } from "@/lib/format";

export const metadata = { title: "تفاصيل الطلب" };

export default async function CustomerOrderDetailPage({
  params,
}: PageProps<"/dashboard/orders/[id]">) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/dashboard");

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, customerId: user.id },
    include: {
      items: true,
      messages: {
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) notFound();

  const sendAction = sendMessage.bind(null, order.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/dashboard/orders"
        className="text-sm font-medium text-teal-700"
      >
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
        {order.status === "PENDING" ? (
          <form action={cancelOrder.bind(null, order.id)}>
            <SubmitButton variant="outline" size="sm" pendingText="...">
              إلغاء الطلب
            </SubmitButton>
          </form>
        ) : null}
      </div>

      <div className="mt-6">
        <OrderTimeline status={order.status} />
      </div>

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

          <Card>
            <CardHeader>
              <CardTitle>المحادثة مع فريق سينوفا</CardTitle>
            </CardHeader>
            <CardBody>
              <MessageThread
                messages={order.messages}
                currentUserId={user.id}
                platformLabel="فريق سينوفا"
              />
              <div className="mt-3 border-t border-zinc-100 pt-3">
                <MessageForm action={sendAction} />
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>جهة الطلب</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-900 text-base font-bold text-amber-500">
                  س
                </span>
                <span className="font-semibold text-zinc-900">سينوفا</span>
              </div>
              <p className="text-zinc-600">
                يتولى فريق سينوفا تنفيذ طلبك ومتابعته معك عبر المحادثة أعلاه.
              </p>
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

          <Link
            href="/materials"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            تصفح منتجات أخرى
          </Link>
        </div>
      </div>
    </div>
  );
}
