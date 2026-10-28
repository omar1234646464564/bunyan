import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MaterialCard } from "@/components/material-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Input, Select, Field } from "@/components/ui/fields";
import { buttonVariants } from "@/components/ui/button";
import { SAUDI_CITIES } from "@/lib/constants";

export const metadata = { title: "المنتجات" };

const PAGE_SIZE = 12;

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MaterialsPage({
  searchParams,
}: PageProps<"/materials">) {
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const categorySlug = one(sp.category).trim();
  const city = one(sp.city).trim();
  const min = one(sp.min).trim();
  const max = one(sp.max).trim();
  const sort = one(sp.sort) || "newest";
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const where: Prisma.MaterialWhereInput = {
    isActive: true,
  };
  if (q) where.name = { contains: q };
  if (categorySlug) where.category = { slug: categorySlug };
  if (city) where.city = city;
  if (min || max) {
    where.price = {};
    if (min) where.price.gte = Number(min);
    if (max) where.price.lte = Number(max);
  }

  const orderBy: Prisma.MaterialOrderByWithRelationInput =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [total, materials, categories] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">المنتجات</h1>
          <p className="mt-1 text-sm text-zinc-500">{total} منتج متاح</p>
        </div>
        <form className="flex items-center gap-2" action="/materials">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="ابحث..."
              className="h-10 w-40 bg-transparent text-sm outline-none sm:w-56"
            />
          </div>
        </form>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <Card className="p-5">
            <form method="get" action="/materials" className="space-y-4">
              <input type="hidden" name="q" value={q} />
              <Field label="التصنيف">
                <Select name="category" defaultValue={categorySlug}>
                  <option value="">كل التصنيفات</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="المدينة">
                <Select name="city" defaultValue={city}>
                  <option value="">كل المدن</option>
                  {SAUDI_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="أقل سعر">
                  <Input name="min" type="number" min="0" defaultValue={min} />
                </Field>
                <Field label="أعلى سعر">
                  <Input name="max" type="number" min="0" defaultValue={max} />
                </Field>
              </div>
              <Field label="الترتيب">
                <Select name="sort" defaultValue={sort}>
                  <option value="newest">الأحدث</option>
                  <option value="price-asc">السعر: من الأقل</option>
                  <option value="price-desc">السعر: من الأعلى</option>
                </Select>
              </Field>
              <div className="flex gap-2">
                <button type="submit" className={buttonVariants({ size: "sm", className: "flex-1" })}>
                  تطبيق
                </button>
                <Link
                  href="/materials"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  مسح
                </Link>
              </div>
            </form>
          </Card>
        </aside>

        <div>
          {materials.length === 0 ? (
            <EmptyState
              title="لا توجد نتائج مطابقة"
              description="جرّب تغيير الفلاتر أو البحث بكلمة أخرى."
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {materials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </div>
              <div className="mt-8">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  basePath="/materials"
                  params={{ q, category: categorySlug, city, min, max, sort }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
