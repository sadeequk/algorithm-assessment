import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "x-support-ops", value: "algorithm-assessment" },
        ],
      },
    ];
  },
};

export default nextConfig;
