import { existsSync, readdirSync } from "node:fs";
import type { NextConfig } from "next";

const staticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";
const contentExtensions = (["posts", "chatters"] as const)
  .filter((folder) => !staticExport || (
    existsSync(folder) && readdirSync(folder).some((file) => file.endsWith(".md"))
  ))
  .map((folder) => `${folder}.tsx`);

const nextConfig: NextConfig = {
  pageExtensions: [...contentExtensions, ...(staticExport ? [] : ["server.ts"]), "tsx", "ts"],
  ...(staticExport && { output: "export", trailingSlash: true }),
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
