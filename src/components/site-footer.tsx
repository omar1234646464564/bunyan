import Link from "next/link";
import {
  APP_NAME,
  APP_TAGLINE,
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_PHONE_DISPLAY,
} from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-zinc-900">{APP_NAME}</p>
          <p className="mt-1 text-sm text-zinc-500">{APP_TAGLINE}</p>
          <p className="mt-3 text-sm text-zinc-500">
            توريد مواد البناء والحديد والأخشاب للشركات والمشاريع في المملكة
            العربية السعودية.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">تصفح</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <Link href="/materials" className="hover:text-teal-700">
                المنتجات
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-teal-700">
                التصنيفات
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-teal-700">
                إنشاء حساب
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">تواصل معنا</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600">
            <li>
              <a href={`tel:${COMPANY_PHONE}`} dir="ltr" className="hover:text-teal-700">
                {COMPANY_PHONE_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${COMPANY_EMAIL}`} className="hover:text-teal-700">
                {COMPANY_EMAIL}
              </a>
            </li>
            <li>{COMPANY_ADDRESS}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} {APP_NAME}. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
