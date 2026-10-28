import Link from "next/link";
import { HardHat, LayoutDashboard, LogOut, PlusCircle, UserPlus } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { logout } from "@/actions/auth";
import { APP_NAME, APP_TAGLINE, ROLE_LABELS } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-900 text-amber-500">
            <HardHat className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-zinc-900">{APP_NAME}</span>
            <span className="text-[11px] text-zinc-500">{APP_TAGLINE}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink href="/materials">المنتجات</NavLink>
          <NavLink href="/categories">التصنيفات</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={dashboardHref(user.role)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <LayoutDashboard className="h-4 w-4" />
                لوحتي
              </Link>
              <div className="hidden items-center gap-2 text-sm text-zinc-600 sm:flex">
                <span>{user.name}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  title="تسجيل الخروج"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                دخول
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                <UserPlus className="h-4 w-4" />
                حساب جديد
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-2 md:hidden">
        <NavLink href="/materials">المنتجات</NavLink>
        <NavLink href="/categories">التصنيفات</NavLink>
        {user?.role === "ADMIN" ? (
          <NavLink href="/admin/materials/new">
            <PlusCircle className="ml-1 inline h-4 w-4" />
            أضف منتج
          </NavLink>
        ) : null}
      </nav>
    </header>
  );
}

function dashboardHref(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    default:
      return "/dashboard";
  }
}
