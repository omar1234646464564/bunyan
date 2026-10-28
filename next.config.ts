import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic dynamic rendering model. Cache Components can be adopted later.
  cacheComponents: false,
  experimental: {
    // Product photos are uploaded through a Server Action; the default 1 MB
    // cap is too small for phone photos. Validated again server-side.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Ensure the generated Prisma Client and its native query engine are bundled
  // into the serverless functions (Vercel) instead of being missed by tracing.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
};

export default nextConfig;
