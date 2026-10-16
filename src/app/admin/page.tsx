import Link from "next/link";
import { Users, Building2, Package, ClipboardList, Clock, Truck } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SupplierStatusBadge, OrderStatusBadge } from "@/components/status-badge";
import { formatDate, formatSAR, toNumber } from "@/lib/format";

export const metadata = { title: "لوحة الإدارة" };

export default async function AdminDashboardPage() {
  await requireRole("ADMIN");

  const [
    usersCount,
    suppliersCount,
    pendingCount,
    materialsCount,
    ordersCount,
    awaitingCount,
    pendingSuppliers,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.supplierProfile.count(),
    prisma.supplierProfile.count({ where: { status: "PENDING" } }),
    prisma.material.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "AWAITING_SUPPLIER" } }),
    prisma.supplierProfile.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.order.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard icon={<Users className="h-5 w-5" />} label="المستخدمون" value={usersCount} />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="المنشآت" value={suppliersCount} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="بانتظار الاعتماد" value={pendingCount} highlight />
        <StatCard icon={<Package className="h-5 w-5" />} label="المواد" value={materialsCount} />
        <StatCard icon={<ClipboardList className="h-5 w-5" />} label="الطلبات" value={ordersCount} />
        <StatCard icon={<Truck className="h-5 w-5" />} label="بانتظار تعيين مورد" value={awaitingCount} highlight />
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-zinc-900">أحدث الطلبات</h2>
          <Link
            href="/admin/orders"
            className={buttonVariants({ size: "sm" })}
          >
            إدارة الطلبات
          </Link>
        </div>

        <div className="mt-4">
          {recentOrders.length === 0 ? (
            <Card className="p-6 text-center text-sm text-zinc-500">
              لا توجد طلبات بعد.
            </Card>
          ) : (
            <Card className="divide-y divide-zinc-100">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      {order.number}
                      <OrderStatusBadge status={order.status} />
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {order.customer.name} · {formatDate(order.createdAt)}
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

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-bold text-zinc-900">
            طلبات اعتماد الموردين
          </h2>
          <Link
            href="/admin/suppliers?status=PENDING"
            className={buttonVariants({ size: "sm" })}
          >
            إدارة الموردين
          </Link>
        </div>

        <div className="mt-4">
          {pendingSuppliers.length === 0 ? (
            <Card className="p-6 text-center text-sm text-zinc-500">
              لا توجد طلبات اعتماد حالياً.
            </Card>
          ) : (
            <Card className="divide-y divide-zinc-100">
              {pendingSuppliers.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/admin/suppliers?status=PENDING`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {supplier.companyName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {supplier.city} — {supplier.region} ·{" "}
                      {formatDate(supplier.createdAt)}
                    </p>
                  </div>
                  <SupplierStatusBadge status={supplier.status} />
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
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span
        className={
          highlight
            ? "flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
            : "flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"
        }
      >
        {icon}
      </span>
      <div>
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="text-xl font-bold text-zinc-900">{value}</p>
      </div>
    </Card>
  );
}
