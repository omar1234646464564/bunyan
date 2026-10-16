import { RegisterCustomerForm } from "@/components/forms/register-customer-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "حساب عميل جديد" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center px-4 py-16">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-zinc-900">إنشاء حساب عميل</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ابحث عن مواد البناء واطلبها من موردين معتمدين.
        </p>
        <div className="mt-6">
          <RegisterCustomerForm />
        </div>
      </Card>
    </div>
  );
}
