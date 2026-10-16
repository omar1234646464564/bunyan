import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "تسجيل الدخول" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Card className="p-8">
        <h1 className="text-xl font-bold text-zinc-900">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-zinc-500">
          ادخل إلى حسابك لمتابعة الطلبات والتواصل مع الموردين.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
