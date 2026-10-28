import Link from "next/link";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { createMaterial } from "@/actions/materials";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";

export const metadata = { title: "إضافة منتج" };

export default async function NewMaterialPage() {
  await requireRole("ADMIN");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/materials"
        className="text-sm font-medium text-teal-700"
      >
        ← كل المنتجات
      </Link>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>إضافة منتج جديد</CardTitle>
        </CardHeader>
        <CardBody>
          {categories.length === 0 ? (
            <p className="text-sm text-zinc-500">
              أضف تصنيفاً واحداً على الأقل قبل إضافة المنتجات.
            </p>
          ) : (
            <MaterialForm action={createMaterial} categories={categories} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
