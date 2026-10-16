import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { NavLink } from "@/components/nav-link";
import { Alert } from "@/components/alert";

export default async function SupplierLayout({
  children,
}: LayoutProps<"/supplier">) {
  const user = await requireUser();
  if (user.role !== "SUPPLIER") redirect("/dashboard");

  const supplier = user.supplier;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">لوحة المورد</h1>
          <p className="text-sm text-zinc-500">
            {supplier?.companyName ?? user.name}
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink href="/supplier/dashboard">نظرة عامة</NavLink>
          <NavLink href="/supplier/materials">موادي</NavLink>
          <NavLink href="/supplier/orders">الطلبات</NavLink>
          <NavLink href="/supplier/profile">بيانات المنشأة</NavLink>
        </nav>
      </div>

      {supplier?.status === "PENDING" ? (
        <div className="mt-5">
          <Alert variant="info">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              منشأتك قيد المراجعة من فريق بنيان. ستظهر موادك للعملاء بعد
              الاعتماد.
            </span>
          </Alert>
        </div>
      ) : null}
      {supplier?.status === "REJECTED" ? (
        <div className="mt-5">
          <Alert variant="error">
            لم يتم اعتماد منشأتك. يرجى تحديث البيانات والتواصل مع الدعم.
          </Alert>
        </div>
      ) : null}
      {supplier?.status === "SUSPENDED" ? (
        <div className="mt-5">
          <Alert variant="error">
            تم إيقاف حساب منشأتك مؤقتاً. تواصل مع الدعم للمزيد.
          </Alert>
        </div>
      ) : null}

      <div className="mt-6">{children}</div>
    </div>
  );
}
