import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/dal";
import { Card, Badge } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { RatingStars } from "@/components/rating-stars";
import { MaterialCard } from "@/components/material-card";
import { OrderForm } from "@/components/forms/order-form";
import { formatNumber, formatSAR, toNumber } from "@/lib/format";
import { UNIT_LABELS } from "@/lib/constants";

export async function generateMetadata({ params }: PageProps<"/materials/[id]">) {
  const { id } = await params;
  const material = await prisma.material.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: material?.name ?? "مادة غير موجودة" };
}

export default async function MaterialDetailPage({
  params,
}: PageProps<"/materials/[id]">) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: { include: { user: { select: { phone: true } } } },
    },
  });

  if (!material) notFound();

  const user = await getCurrentUser();

  const related = await prisma.material.findMany({
    where: {
      isActive: true,
      categoryId: material.categoryId,
      id: { not: material.id },
      supplier: { status: "APPROVED" },
    },
    include: {
      category: true,
      supplier: { select: { companyName: true, slug: true } },
    },
    take: 4,
  });

  const supplier = material.supplier;
  const avg =
    supplier.ratingCount > 0 ? supplier.ratingSum / supplier.ratingCount : 0;
  const available = material.isActive && supplier.status === "APPROVED";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href="/materials" className="hover:text-teal-700">
          المواد
        </Link>
        <span>/</span>
        <Link
          href={`/materials?category=${material.category.slug}`}
          className="hover:text-teal-700"
        >
          {material.category.name}
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{material.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-teal-50 to-zinc-100">
              {material.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={material.imageUrl}
                  alt={material.name}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-teal-800/30">
                  {material.name.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-teal-100 text-teal-800">
                  {material.category.name}
                </Badge>
                {available ? (
                  <Badge className="bg-emerald-100 text-emerald-800">
                    متوفرة
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">غير متوفرة</Badge>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-zinc-900">
                {material.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {material.city} — {material.region}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  أدنى كمية {formatNumber(material.minOrderQty)}{" "}
                  {UNIT_LABELS[material.unit]}
                </span>
              </div>
              {material.description ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-600">
                  {material.description}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-zinc-900">عن المورد</h2>
            <div className="mt-4 flex items-start gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
                {supplier.companyName.slice(0, 1)}
              </span>
              <div className="flex-1">
                <Link
                  href={`/suppliers/${supplier.slug}`}
                  className="font-semibold text-zinc-900 hover:text-teal-700"
                >
                  {supplier.companyName}
                </Link>
                <div className="mt-1">
                  <RatingStars value={avg} count={supplier.ratingCount} />
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-zinc-500">
                  <MapPin className="h-4 w-4" />
                  {supplier.city} — {supplier.region}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {supplier.phone ? (
                <a
                  href={`tel:${supplier.phone}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {supplier.phone}
                </a>
              ) : null}
              {supplier.whatsapp ? (
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/^0/, "966")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  واتساب
                </a>
              ) : null}
              <Link
                href={`/suppliers/${supplier.slug}`}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                عرض الملف
              </Link>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-zinc-900">
                  {formatSAR(toNumber(material.price))}
                </p>
                <p className="text-sm text-zinc-500">
                  / {UNIT_LABELS[material.unit] ?? material.unit}
                </p>
              </div>
              {material.stock != null ? (
                <span className="text-xs text-zinc-500">
                  المتاح {formatNumber(material.stock)}
                </span>
              ) : null}
            </div>

            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-700" />
                مورد معتمد من <span className="font-medium">بنيان</span>
              </p>
              <p className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-teal-700" />
                التسليم حسب اتفاقك مع المورد
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              اطلب هذه المادة
            </h2>
            <div className="mt-4">
              {!available ? (
                <p className="text-sm text-zinc-500">
                  هذه المادة غير متاحة للطلب حالياً.
                </p>
              ) : user?.role === "CUSTOMER" ? (
                <OrderForm
                  materialId={material.id}
                  unitLabel={UNIT_LABELS[material.unit] ?? material.unit}
                  unitPrice={toNumber(material.price)}
                  minOrderQty={material.minOrderQty}
                  maxQty={material.stock}
                  defaultCity={user.city ?? ""}
                  defaultPhone={user.phone ?? ""}
                />
              ) : user ? (
                <p className="text-sm text-zinc-500">
                  الطلبات متاحة لحسابات العملاء فقط.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">
                    سجّل الدخول كمستخدم لإرسال طلب إلى المورد.
                  </p>
                  <Link
                    href="/login"
                    className={buttonVariants({ className: "w-full" })}
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full",
                    })}
                  >
                    إنشاء حساب عميل
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-zinc-900">
            مواد مشابهة من {material.category.name}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <MaterialCard key={item.id} material={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
