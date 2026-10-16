import { RegisterSupplierForm } from "@/components/forms/register-supplier-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "تسجيل منشأة مورد" };

export default function RegisterSupplierPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col justify-center px-4 py-16">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-zinc-900">تسجيل منشأة مورد</h1>
        <p className="mt-1 text-sm text-zinc-500">
          اعرض موادك أمام عملاء المقاولات. تتم مراجعة الطلب قبل النشر.
        </p>
        <div className="mt-6">
          <RegisterSupplierForm />
        </div>
      </Card>
    </div>
  );
}
