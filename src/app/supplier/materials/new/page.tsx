import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { createMaterial } from "@/actions/materials";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";

export const metadata = { title: "إضافة مادة" };

export default async function NewMaterialPage() {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>إضافة مادة جديدة</CardTitle>
        </CardHeader>
        <CardBody>
          <MaterialForm
            action={createMaterial}
            categories={categories}
            defaults={{
              unit: "PIECE",
              minOrderQty: 1,
              city: supplier.city,
              region: supplier.region,
            }}
            submitLabel="نشر المادة"
          />
        </CardBody>
      </Card>
    </div>
  );
}
