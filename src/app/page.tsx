import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  HardHat,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
  Handshake,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MaterialCard } from "@/components/material-card";
import { SupplierCard } from "@/components/supplier-card";
import { APP_NAME } from "@/lib/constants";

export default async function HomePage() {
  const [materials, suppliers, categories, materialCount, supplierCount] =
    await Promise.all([
      prisma.material.findMany({
        where: { isActive: true, supplier: { status: "APPROVED" } },
        include: {
          category: true,
          supplier: { select: { companyName: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.supplierProfile.findMany({
        where: { status: "APPROVED" },
        include: { _count: { select: { materials: true } } },
        orderBy: [{ ratingCount: "desc" }, { createdAt: "asc" }],
        take: 6,
      }),
      prisma.category.findMany({
        include: { _count: { select: { materials: true } } },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.material.count({ where: { isActive: true } }),
      prisma.supplierProfile.count({ where: { status: "APPROVED" } }),
    ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 to-teal-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
            <HardHat className="h-4 w-4" />
            منصة سعودية لمواد البناء
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            كل مواد البناء التي تحتاجها، من موردين موثوقين في مكان واحد
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-teal-50/90">
            {APP_NAME} يربط موردي مواد البناء بعملاء المقاولات والمشاريع في جميع
            مناطق المملكة. تصفح، قارن الأسعار، وأرسل طلبك مباشرة للمورد.
          </p>

          <form
            action="/materials"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg"
          >
            <div className="flex flex-1 items-center gap-2 px-2 text-zinc-500">
              <Search className="h-5 w-5" />
              <input
                name="q"
                placeholder="ابحث عن أسمنت، حديد، بلاط..."
                className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button type="submit" className={buttonVariants({ size: "md" })}>
              ابحث
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-teal-50/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> موردون معتمدون
            </span>
            <span className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4" /> {materialCount}+ مادة
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {supplierCount} منشأة
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-zinc-900">تصفح حسب التصنيف</h2>
          <Link href="/categories" className="text-sm font-medium text-teal-700">
            كل التصنيفات
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/materials?category=${category.slug}`}>
              <Card className="p-4 transition-shadow hover:shadow-md">
                <p className="text-sm font-semibold text-zinc-900">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {category._count.materials} مادة
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-zinc-900">أحدث المواد</h2>
          <Link
            href="/materials"
            className="flex items-center gap-1 text-sm font-medium text-teal-700"
          >
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        {materials.length === 0 ? (
          <Card className="mt-5 p-8 text-center text-sm text-zinc-500">
            لا توجد مواد منشورة بعد. سيتم عرض المواد فور اعتماد الموردين.
          </Card>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>

      {suppliers.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold text-zinc-900">موردون مميزون</h2>
            <Link
              href="/suppliers"
              className="flex items-center gap-1 text-sm font-medium text-teal-700"
            >
              دليل الموردين <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-xl font-bold text-zinc-900">
          كيف تعمل المنصة؟
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-6 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">1. ابحث وقارن</p>
            <p className="mt-1 text-sm text-zinc-600">
              تصفح المواد، قارن الأسعار والمواصفات بين الموردين المعتمدين.
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Handshake className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">2. اطلب مباشرة</p>
            <p className="mt-1 text-sm text-zinc-600">
              أرسل طلبك للمورد مع الكميات وتفاصيل التسليم، وتواصل معه داخل المنصة.
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Truck className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">3. استلم وتابع</p>
            <p className="mt-1 text-sm text-zinc-600">
              تابع حالة الطلب حتى التسليم، ثم قيّم تجربتك مع المورد.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="flex flex-col items-center justify-between gap-4 bg-teal-50 p-8 sm:flex-row">
          <div>
            <h2 className="text-lg font-bold text-teal-900">
              هل أنت مورد لمواد البناء؟
            </h2>
            <p className="mt-1 text-sm text-teal-800/80">
              سجّل منشأتك مجاناً واعرض موادك أمام عملاء المقاولات في كل المملكة.
            </p>
          </div>
          <Link
            href="/register/supplier"
            className={buttonVariants({ size: "lg", className: "shrink-0" })}
          >
            سجّل منشأتك
          </Link>
        </Card>
      </section>
    </div>
  );
}
