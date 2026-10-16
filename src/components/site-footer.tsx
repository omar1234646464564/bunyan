import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-zinc-900">{APP_NAME}</p>
          <p className="mt-1 text-sm text-zinc-500">{APP_TAGLINE}</p>
          <p className="mt-3 text-sm text-zinc-500">
            منصة سعودية تربط موردي مواد البناء بعملاء المقاولات والمشاريع.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">تصفح</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <Link href="/materials" className="hover:text-teal-700">
                المواد
              </Link>
            </li>
            <li>
              <Link href="/suppliers" className="hover:text-teal-700">
                الموردون
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-teal-700">
                التصنيفات
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">للموردين</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <Link href="/register/supplier" className="hover:text-teal-700">
                سجّل كمنشأة
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-teal-700">
                دخول الموردين
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
