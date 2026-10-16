import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { deleteCategory } from "@/actions/admin";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { CategoryForm } from "@/components/forms/category-form";
import { Trash2 } from "lucide-react";

export const metadata = { title: "إدارة التصنيفات" };

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { materials: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">
          التصنيفات ({categories.length})
        </h2>
        <Card className="mt-4 divide-y divide-zinc-100">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {category.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {category.slug} · {category._count.materials} مادة
                </p>
              </div>
              {category._count.materials === 0 ? (
                <form action={deleteCategory.bind(null, category.id)}>
                  <SubmitButton variant="ghost" size="icon" pendingText="">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </SubmitButton>
                </form>
              ) : (
                <span className="text-xs text-zinc-400">قيد الاستخدام</span>
              )}
            </div>
          ))}
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>إضافة تصنيف</CardTitle>
          </CardHeader>
          <CardBody>
            <CategoryForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
