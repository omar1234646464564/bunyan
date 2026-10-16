import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatSAR, toNumber } from "@/lib/format";

export const metadata = { title: "الطلبات" };

const PAGE_SIZE = 10;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SupplierOrdersPage({
  searchParams,
}: PageProps<"/supplier/orders">) {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const sp = await searchParams;
  const status = one(sp.status).trim();
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.OrderWhereInput = {
    supplierId: supplier.id,
    status: { not: "AWAITING_SUPPLIER" },
  };
  if (status) where.status = status as never;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h2 className="text-lg font-bold text-zinc-900">الطلبات الواردة</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/supplier/orders"
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
            href={`/supplier/orders?status=${key}`}
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
          <EmptyState title="لا توجد طلبات" description="لا توجد طلبات مطابقة." />
        ) : (
          <>
            <Card className="divide-y divide-zinc-100">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/supplier/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      {order.number}
                      <OrderStatusBadge status={order.status} />
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.customer.name} · {order._count.items} مادة ·{" "}
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
                basePath="/supplier/orders"
                params={{ status }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
