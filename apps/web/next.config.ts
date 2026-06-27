import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@punchless/ui", "@punchless/types", "@punchless/config"],
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
