import Link from "next/link";
import { Package, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatSAR, toNumber } from "@/lib/format";
import { redirect } from "next/navigation";

export const metadata = { title: "لوحة المورد" };

export default async function SupplierDashboardPage() {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const [materialsCount, grouped, recentOrders] = await Promise.all([
    prisma.material.count({ where: { supplierId: supplier.id } }),
    prisma.order.groupBy({
      by: ["status"],
      where: { supplierId: supplier.id, status: { not: "AWAITING_SUPPLIER" } },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { supplierId: supplier.id, status: { not: "AWAITING_SUPPLIER" } },
      include: {
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const countOf = (status: string) =>
    grouped.find((g) => g.status === status)?._count._all ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Package className="h-5 w-5" />} label="المواد" value={materialsCount} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="الطلبات" value={total} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="قيد التجهيز" value={countOf("PROCESSING")} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="تم التسليم" value={countOf("DELIVERED")} />
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-zinc-900">أحدث الطلبات</h2>
          <div className="flex gap-2">
            <Link
              href="/supplier/materials/new"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              أضف مادة
            </Link>
            <Link
              href="/supplier/orders"
              className={buttonVariants({ size: "sm" })}
            >
              كل الطلبات
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {recentOrders.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات بعد"
              description="ستظهر هنا الطلبات التي تعيّنها لك منصة بنيان."
            />
          ) : (
            <Card className="divide-y divide-zinc-100">
              {recentOrders.map((order) => (
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
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </span>
      <div>
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-zinc-900">{value}</p>
      </div>
    </Card>
  );
}
