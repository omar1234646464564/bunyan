import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatSAR, toNumber } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "طلباتي" };

const PAGE_SIZE = 10;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function CustomerOrdersPage({
  searchParams,
}: PageProps<"/dashboard/orders">) {
  const user = await requireUser();
  if (user.role !== "CUSTOMER") redirect("/dashboard");

  const sp = await searchParams;
  const status = one(sp.status).trim();
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.OrderWhereInput = { customerId: user.id };
  if (status) where.status = status as never;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">طلباتي</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/dashboard/orders"
          className={buttonVariants({
            variant: status ? "outline" : "primary",
            size: "sm",
          })}
        >
          الكل
        </Link>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/dashboard/orders?status=${key}`}
            className={buttonVariants({
              variant: status === key ? "primary" : "outline",
              size: "sm",
            })}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            description="لم تقم بأي طلبات مطابقة بعد."
            actionHref="/materials"
            actionLabel="تصفح المواد"
          />
        ) : (
          <>
            <Card className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      {order.number}
                      <OrderStatusBadge status={order.status} />
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      سينوفا · {order._count.items} منتج ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-zinc-900">
                    {formatSAR(toNumber(order.total))}
                  </span>
                </Link>
              ))}
            </Card>
            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath="/dashboard/orders"
                params={{ status }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
