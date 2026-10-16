import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { setSupplierStatus } from "@/actions/admin";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { SupplierStatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { SUPPLIER_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata = { title: "إدارة الموردين" };

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AdminSuppliersPage({
  searchParams,
}: PageProps<"/admin/suppliers">) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const status = one(sp.status).trim();

  const where: Prisma.SupplierProfileWhereInput = {};
  if (status) where.status = status as never;

  const suppliers = await prisma.supplierProfile.findMany({
    where,
    include: { _count: { select: { materials: true, orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-zinc-900">الموردون</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/suppliers"
          className={buttonVariants({
            variant: status ? "outline" : "primary",
            size: "sm",
          })}
        >
          الكل
        </Link>
        {Object.entries(SUPPLIER_STATUS_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/suppliers?status=${key}`}
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
        {suppliers.length === 0 ? (
          <EmptyState title="لا يوجد موردون" description="لا توجد منشآت مطابقة." />
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/suppliers/${supplier.slug}`}
                        className="text-sm font-semibold text-zinc-900 hover:text-teal-700"
                      >
                        {supplier.companyName}
                      </Link>
                      <SupplierStatusBadge status={supplier.status} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {supplier.city} — {supplier.region} ·{" "}
                      {supplier._count.materials} مادة ·{" "}
                      {supplier._count.orders} طلب ·{" "}
                      {formatDate(supplier.createdAt)}
                    </p>
                    {supplier.crNumber ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        س.ت: {supplier.crNumber}
                        {supplier.vatNumber ? ` · ضريبي: ${supplier.vatNumber}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {supplier.status !== "APPROVED" ? (
                      <form
                        action={setSupplierStatus.bind(null, supplier.id, "APPROVED")}
                      >
                        <SubmitButton size="sm" pendingText="...">
                          اعتماد
                        </SubmitButton>
                      </form>
                    ) : null}
                    {supplier.status !== "REJECTED" ? (
                      <form
                        action={setSupplierStatus.bind(null, supplier.id, "REJECTED")}
                      >
                        <SubmitButton variant="outline" size="sm" pendingText="...">
                          رفض
                        </SubmitButton>
                      </form>
                    ) : null}
                    {supplier.status !== "SUSPENDED" ? (
                      <form
                        action={setSupplierStatus.bind(null, supplier.id, "SUSPENDED")}
                      >
                        <SubmitButton variant="ghost" size="sm" pendingText="...">
                          إيقاف
                        </SubmitButton>
                      </form>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
