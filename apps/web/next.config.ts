import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@punchless/ui", "@punchless/types", "@punchless/config"],
};

export default nextConfig;
