import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const metadata = { title: "التصنيفات" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { materials: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">التصنيفات</h1>
      <p className="mt-1 text-sm text-zinc-500">
        تصفح مواد البناء حسب النوع
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/materials?category=${category.slug}`}>
            <Card className="h-full p-5 transition-shadow hover:shadow-md">
              <p className="text-base font-semibold text-zinc-900">
                {category.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {category._count.materials} مادة
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
