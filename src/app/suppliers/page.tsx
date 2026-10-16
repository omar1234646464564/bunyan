import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SupplierCard } from "@/components/supplier-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/fields";
import { buttonVariants } from "@/components/ui/button";
import { SAUDI_REGIONS } from "@/lib/constants";
import Link from "next/link";

export const metadata = { title: "الموردون" };

const PAGE_SIZE = 12;

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/suppliers">) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const region = one(sp.region).trim();
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.SupplierProfileWhereInput = { status: "APPROVED" };
  if (q) where.companyName = { contains: q };
  if (region) where.region = region;

  const [total, suppliers] = await Promise.all([
    prisma.supplierProfile.count({ where }),
    prisma.supplierProfile.findMany({
      where,
      include: { _count: { select: { materials: true } } },
      orderBy: [{ ratingCount: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">دليل الموردين</h1>
      <p className="mt-1 text-sm text-zinc-500">{total} منشأة معتمدة</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <Card className="p-5">
            <form method="get" action="/suppliers" className="space-y-4">
              <Field label="اسم المنشأة">
                <Input name="q" defaultValue={q} placeholder="ابحث..." />
              </Field>
              <Field label="المنطقة">
                <Select name="region" defaultValue={region}>
                  <option value="">كل المناطق</option>
                  {SAUDI_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={buttonVariants({ size: "sm", className: "flex-1" })}
                >
                  تطبيق
                </button>
                <Link
                  href="/suppliers"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  مسح
                </Link>
              </div>
            </form>
          </Card>
        </aside>

        <div>
          {suppliers.length === 0 ? (
            <EmptyState
              title="لا يوجد موردون مطابقون"
              description="جرّب تغيير الفلاتر."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {suppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  basePath="/suppliers"
                  params={{ q, region }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
