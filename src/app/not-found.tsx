import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-teal-700">404</p>
      <h1 className="mt-4 text-xl font-bold text-zinc-900">
        الصفحة غير موجودة
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        قد يكون الرابط غير صحيح أو أن المحتوى تم حذفه.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        العودة للرئيسية
      </Link>
    </div>
  );
}
