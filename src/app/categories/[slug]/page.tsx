import { redirect } from "next/navigation";

export default async function CategoryPage({
  params,
}: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  redirect(`/materials?category=${encodeURIComponent(slug)}`);
}
