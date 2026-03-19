import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  env: {
    APP_URL: process.env.APP_URL ?? "",
    HOME_URL: process.env.HOME_URL ?? "",
  },
};

export default nextConfig;
