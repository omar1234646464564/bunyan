import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Clock, CheckCircle2, ShoppingCart } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate, formatSAR, toNumber } from "@/lib/format";

export const metadata = { title: "لوحتي" };

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "SUPPLIER") redirect("/supplier/dashboard");
  if (user.role === "ADMIN") redirect("/admin");

  const [orders, grouped] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: user.id },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { customerId: user.id },
      _count: { _all: true },
    }),
  ]);

  const countOf = (status: string) =>
    grouped.find((g) => g.status === status)?._count._all ?? 0;
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            مرحباً، {user.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            تابع طلباتك وتواصل مع فريق بنيان.
          </p>
        </div>
        <Link href="/materials" className={buttonVariants()}>
          <ShoppingCart className="h-4 w-4" />
          تسوّق المواد
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Package className="h-5 w-5" />} label="إجمالي الطلبات" value={total} />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="بانتظار التعيين"
          value={countOf("AWAITING_SUPPLIER")}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="تم التسليم"
          value={countOf("DELIVERED")}
        />
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-zinc-900">أحدث الطلبات</h2>
          <Link href="/dashboard/orders" className="text-sm font-medium text-teal-700">
            كل الطلبات
          </Link>
        </div>

        <div className="mt-4">
          {orders.length === 0 ? (
            <EmptyState
              title="لا توجد طلبات بعد"
              description="ابدأ بتصفح المواد وإرسال طلب."
              actionHref="/materials"
              actionLabel="تصفح المواد"
            />
          ) : (
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
                    <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                      بنيان · {order._count.items} مادة ·{" "}
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
