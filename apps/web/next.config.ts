import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@myprotocolstack/ui", "@myprotocolstack/database"],
};

export default nextConfig;
