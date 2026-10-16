import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Classic dynamic rendering model. Cache Components can be adopted later.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
