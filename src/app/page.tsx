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
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MaterialCard } from "@/components/material-card";
import {
  APP_NAME,
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_PHONE_DISPLAY,
} from "@/lib/constants";

export default async function HomePage() {
  const [materials, categories, materialCount, categoryCount] =
    await Promise.all([
      prisma.material.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({
        include: { _count: { select: { materials: true } } },
        orderBy: { name: "asc" },
        take: 8,
      }),
      prisma.material.count({ where: { isActive: true } }),
      prisma.category.count(),
    ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 to-teal-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
            <HardHat className="h-4 w-4" />
            توريد مواد البناء والحديد والأخشاب
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            {APP_NAME} — شريكك الموثوق في توريد مواد البناء
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-teal-50/90">
            نوفّر منتجات الحديد والصلب، والأخشاب، والشبك والأسلاك، والأسوار
            والأسقف المعدنية، وشبك الأرضيات، لمشاريع المقاولات والصناعة في جميع
            مناطق المملكة العربية السعودية.
          </p>

          <form
            action="/materials"
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-lg"
          >
            <div className="flex flex-1 items-center gap-2 px-2 text-zinc-500">
              <Search className="h-5 w-5" />
              <input
                name="q"
                placeholder="ابحث عن حديد، خشب، شبك..."
                className="h-10 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button type="submit" className={buttonVariants({ size: "md" })}>
              ابحث
            </button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-teal-50/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> جودة موثوقة
            </span>
            <span className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4" /> {materialCount}+ منتج
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> {categoryCount} تصنيف
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
                  {category._count.materials} منتج
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-zinc-900">أحدث المنتجات</h2>
          <Link
            href="/materials"
            className="flex items-center gap-1 text-sm font-medium text-teal-700"
          >
            عرض الكل <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        {materials.length === 0 ? (
          <Card className="mt-5 p-8 text-center text-sm text-zinc-500">
            لا توجد منتجات منشورة بعد.
          </Card>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-xl font-bold text-zinc-900">
          كيف تعمل المنصة؟
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-6 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">1. ابحث واختر</p>
            <p className="mt-1 text-sm text-zinc-600">
              تصفح الكتالوج وقارن المواصفات والأسعار بحسب التصنيف.
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Handshake className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">2. أرسل طلبك</p>
            <p className="mt-1 text-sm text-zinc-600">
              أنشئ طلبك بالكميات وتفاصيل التسليم، وسيتواصل معك فريقنا لتأكيده.
            </p>
          </Card>
          <Card className="p-6 text-center">
            <Truck className="mx-auto h-8 w-8 text-teal-700" />
            <p className="mt-3 font-semibold text-zinc-900">3. تابع التسليم</p>
            <p className="mt-1 text-sm text-zinc-600">
              تابع حالة طلبك من التأكيد حتى التسليم مباشرة من لوحتك.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="flex flex-col items-center justify-between gap-6 bg-teal-50 p-8 sm:flex-row">
          <div>
            <h2 className="text-lg font-bold text-teal-900">
              تواصل مع فريق سينوفا
            </h2>
            <p className="mt-1 text-sm text-teal-800/80">
              فريقنا جاهز لمساعدتك في اختيار المنتجات وطلبات التوريد.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-teal-900">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href={`tel:${COMPANY_PHONE}`} dir="ltr">
                  {COMPANY_PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${COMPANY_EMAIL}`}>{COMPANY_EMAIL}</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {COMPANY_ADDRESS}
              </li>
            </ul>
          </div>
          <Link
            href="/register"
            className={buttonVariants({ size: "lg", className: "shrink-0" })}
          >
            أنشئ حساباً
          </Link>
        </Card>
      </section>
    </div>
  );
}
