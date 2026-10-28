import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { updateMaterial } from "@/actions/materials";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";

export const metadata = { title: "تعديل منتج" };

export default async function EditMaterialPage({
  params,
}: PageProps<"/admin/materials/[id]/edit">) {
  await requireRole("ADMIN");

  const { id } = await params;

  const [material, categories] = await Promise.all([
    prisma.material.findUnique({ where: { id } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!material) notFound();

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
          <CardTitle>تعديل المنتج</CardTitle>
        </CardHeader>
        <CardBody>
          <MaterialForm
            action={updateMaterial.bind(null, material.id)}
            categories={categories}
            defaults={{
              name: material.name,
              categoryId: material.categoryId,
              description: material.description ?? "",
              unit: material.unit,
              price: material.price,
              minOrderQty: material.minOrderQty,
              stock: material.stock,
              city: material.city,
              region: material.region,
              imageUrl: material.imageUrl ?? "",
            }}
            submitLabel="حفظ التعديلات"
          />
        </CardBody>
      </Card>
    </div>
  );
}
