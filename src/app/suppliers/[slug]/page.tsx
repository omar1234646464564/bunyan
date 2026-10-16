import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, MessageCircle, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import { MaterialCard } from "@/components/material-card";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/suppliers/[slug]">) {
  const { slug } = await params;
  const supplier = await prisma.supplierProfile.findUnique({
    where: { slug },
    select: { companyName: true },
  });
  return { title: supplier?.companyName ?? "مورد غير موجود" };
}

export default async function SupplierProfilePage({
  params,
}: PageProps<"/suppliers/[slug]">) {
  const { slug } = await params;

  const supplier = await prisma.supplierProfile.findUnique({
    where: { slug },
    include: {
      materials: {
        where: { isActive: true },
        include: {
          category: true,
          supplier: { select: { companyName: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!supplier || supplier.status === "REJECTED") notFound();

  const avg =
    supplier.ratingCount > 0 ? supplier.ratingSum / supplier.ratingCount : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-l from-teal-800 to-teal-600" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <span className="-mt-14 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-teal-700 text-2xl font-bold text-white">
            {supplier.companyName.slice(0, 1)}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900">
                {supplier.companyName}
              </h1>
              {supplier.status === "APPROVED" ? (
                <Badge className="bg-emerald-100 text-emerald-800">معتمد</Badge>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
              <RatingStars value={avg} count={supplier.ratingCount} />
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {supplier.city} — {supplier.region}
              </span>
            </div>
            {supplier.description ? (
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                {supplier.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {supplier.phone ? (
                <a
                  href={`tel:${supplier.phone}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
                >
                  <Phone className="h-4 w-4" /> {supplier.phone}
                </a>
              ) : null}
              {supplier.whatsapp ? (
                <a
                  href={`https://wa.me/${supplier.whatsapp.replace(/^0/, "966")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 hover:bg-zinc-50"
                >
                  <MessageCircle className="h-4 w-4" /> واتساب
                </a>
              ) : null}
              {supplier.crNumber ? (
                <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-zinc-600">
                  <FileText className="h-4 w-4" /> س.ت {supplier.crNumber}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-zinc-900">
          مواد المورد ({supplier.materials.length})
        </h2>
        {supplier.materials.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="لا توجد مواد منشورة حالياً" />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {supplier.materials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-zinc-900">
          التقييمات ({supplier.ratingCount})
        </h2>
        {supplier.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            لا توجد تقييمات بعد. كن أول من يقيّم هذا المورد بعد إتمام طلب.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {supplier.reviews.map((review) => (
              <Card key={review.id} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-800">
                    {review.customer.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <div className="mt-1">
                  <RatingStars value={review.rating} />
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-zinc-600">{review.comment}</p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link href="/suppliers" className="text-sm font-medium text-teal-700">
          ← رجوع إلى دليل الموردين
        </Link>
      </div>
    </div>
  );
}
