import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { toggleMaterialActive, deleteMaterial } from "@/actions/materials";
import { Card, Badge } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/empty-state";
import { formatSAR, toNumber } from "@/lib/format";
import { UNIT_LABELS } from "@/lib/constants";

export const metadata = { title: "موادي" };

export default async function SupplierMaterialsPage() {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const materials = await prisma.material.findMany({
    where: { supplierId: supplier.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">المواد ({materials.length})</h2>
        <Link href="/supplier/materials/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          أضف مادة
        </Link>
      </div>

      <div className="mt-5">
        {materials.length === 0 ? (
          <EmptyState
            title="لا توجد مواد"
            description="أضف أول مادة لعرضها للعملاء."
            actionHref="/supplier/materials/new"
            actionLabel="أضف مادة"
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-right text-xs text-zinc-500">
                    <th className="px-4 py-3 font-medium">المادة</th>
                    <th className="px-4 py-3 font-medium">التصنيف</th>
                    <th className="px-4 py-3 font-medium">السعر</th>
                    <th className="px-4 py-3 font-medium">المخزون</th>
                    <th className="px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id} className="border-b border-zinc-100">
                      <td className="px-4 py-3">
                        <Link
                          href={`/materials/${material.id}`}
                          className="font-medium text-zinc-900 hover:text-teal-700"
                        >
                          {material.name}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {material.city} · {UNIT_LABELS[material.unit]}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {material.category.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-800">
                        {formatSAR(toNumber(material.price))}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {material.stock ?? "غير محدود"}
                      </td>
                      <td className="px-4 py-3">
                        {material.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800">
                            معروضة
                          </Badge>
                        ) : (
                          <Badge className="bg-zinc-200 text-zinc-600">
                            مخفية
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <form action={toggleMaterialActive.bind(null, material.id)}>
                            <SubmitButton variant="ghost" size="icon" pendingText="">
                              {material.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </SubmitButton>
                          </form>
                          <Link
                            href={`/supplier/materials/${material.id}/edit`}
                            className={buttonVariants({ variant: "ghost", size: "icon" })}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <form action={deleteMaterial.bind(null, material.id)}>
                            <SubmitButton
                              variant="ghost"
                              size="icon"
                              pendingText=""
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
