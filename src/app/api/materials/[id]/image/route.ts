import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const material = await prisma.material.findUnique({
    where: { id },
    select: { imageData: true, imageMime: true },
  });

  if (!material?.imageData) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = new Uint8Array(material.imageData);

  return new Response(bytes, {
    headers: {
      "Content-Type": material.imageMime ?? "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      // The stored URL carries a ?v= version, so it is safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
