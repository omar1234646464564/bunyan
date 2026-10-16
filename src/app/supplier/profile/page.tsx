import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierStatusBadge } from "@/components/status-badge";
import { SupplierProfileForm } from "@/components/forms/supplier-profile-form";
import { ROLE_LABELS } from "@/lib/constants";

export const metadata = { title: "بيانات المنشأة" };

export default async function SupplierProfilePage() {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");
  const supplier = user.supplier;
  if (!supplier) redirect("/register/supplier");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>بيانات المنشأة</CardTitle>
          <SupplierStatusBadge status={supplier.status} />
        </CardHeader>
        <CardBody>
          <SupplierProfileForm
            defaults={{
              companyName: supplier.companyName,
              phone: supplier.phone,
              whatsapp: supplier.whatsapp,
              city: supplier.city,
              region: supplier.region,
              address: supplier.address,
              description: supplier.description,
              logoUrl: supplier.logoUrl,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الحساب</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-zinc-600">
          <p>
            الاسم: <span className="font-medium text-zinc-900">{user.name}</span>
          </p>
          <p>
            البريد:{" "}
            <span className="font-medium text-zinc-900">{user.email}</span>
          </p>
          <p>
            نوع الحساب:{" "}
            <span className="font-medium text-zinc-900">
              {ROLE_LABELS[user.role]}
            </span>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
