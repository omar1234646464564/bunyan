import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { deleteMaterial, toggleMaterialActive } from "@/actions/materials";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/empty-state";
import { formatSAR, toNumber } from "@/lib/format";
import { UNIT_LABELS } from "@/lib/constants";
import { Plus, Pencil } from "lucide-react";

export const metadata = { title: "إدارة المنتجات" };

export default async function AdminMaterialsPage() {
  await requireRole("ADMIN");

  const materials = await prisma.material.findMany({
    include: { category: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">
          المنتجات ({materials.length})
        </h2>
        <Link
          href="/admin/materials/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="h-4 w-4" />
          إضافة منتج
        </Link>
      </div>

      <div className="mt-4">
        {materials.length === 0 ? (
          <EmptyState
            title="لا توجد منتجات"
            description="أضف أول منتج إلى الكتالوج."
            actionHref="/admin/materials/new"
            actionLabel="إضافة منتج"
          />
        ) : (
          <Card className="divide-y divide-zinc-100">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex flex-wrap items-center justify-between gap-4 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-zinc-100 text-lg font-bold text-teal-900/40">
                    {material.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={material.imageUrl}
                        alt={material.name}
                        className="h-14 w-14 object-cover"
                      />
                    ) : (
                      material.name.slice(0, 1)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
                      {material.name}
                      {!material.isActive ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                          غير منشور
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {material.category.name} ·{" "}
                      {formatSAR(toNumber(material.price))} /{" "}
                      {UNIT_LABELS[material.unit] ?? material.unit} · {material.city}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/materials/${material.id}/edit`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Link>
                  <form action={toggleMaterialActive.bind(null, material.id)}>
                    <SubmitButton variant="ghost" size="sm" pendingText="...">
                      {material.isActive ? "إخفاء" : "نشر"}
                    </SubmitButton>
                  </form>
                  <form action={deleteMaterial.bind(null, material.id)}>
                    <SubmitButton variant="ghost" size="sm" pendingText="...">
                      حذف
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
