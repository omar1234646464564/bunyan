import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { NavLink } from "@/components/nav-link";

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">لوحة الإدارة</h1>
          <p className="text-sm text-zinc-500">إدارة المنصة والموردين</p>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink href="/admin">نظرة عامة</NavLink>
          <NavLink href="/admin/orders">الطلبات</NavLink>
          <NavLink href="/admin/suppliers">الموردون</NavLink>
          <NavLink href="/admin/categories">التصنيفات</NavLink>
        </nav>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
