import path from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(projectRoot, "../..");

const reactRoot = path.join(monorepoRoot, "node_modules/react");
const reactDomRoot = path.join(monorepoRoot, "node_modules/react-dom");

const reactAliases = {
  react: reactRoot,
  "react-dom": reactDomRoot,
  "react/jsx-runtime": path.join(reactRoot, "jsx-runtime.js"),
  "react/jsx-dev-runtime": path.join(reactRoot, "jsx-dev-runtime.js"),
};

const nextConfig: NextConfig = {
  transpilePackages: ["@punchless/ui", "@punchless/types", "@punchless/config"],
  turbopack: {
    resolveAlias: reactAliases,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      ...reactAliases,
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/dashboard/clients",
        destination: "/dashboard/customers",
        permanent: true,
      },
      {
        source: "/dashboard/clients/:id/statement",
        destination: "/dashboard/customers/:id/statement",
        permanent: true,
      },
      {
        source: "/dashboard/clients/:id/statement/print",
        destination: "/dashboard/customers/:id/statement/print",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
