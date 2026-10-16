import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { updateMaterial } from "@/actions/materials";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";

export const metadata = { title: "تعديل مادة" };

export default async function EditMaterialPage({
  params,
}: PageProps<"/supplier/materials/[id]/edit">) {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const { id } = await params;

  const [material, categories] = await Promise.all([
    prisma.material.findFirst({ where: { id, supplierId: supplier.id } }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!material) notFound();

  const action = updateMaterial.bind(null, material.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>تعديل المادة</CardTitle>
        </CardHeader>
        <CardBody>
          <MaterialForm
            action={action}
            categories={categories}
            defaults={{
              name: material.name,
              categoryId: material.categoryId,
              description: material.description ?? "",
              unit: material.unit,
              price: material.price.toString(),
              minOrderQty: material.minOrderQty,
              stock: material.stock,
              city: material.city,
              region: material.region,
              imageUrl: material.imageUrl ?? "",
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
