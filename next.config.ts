import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.thespacecinema.it',
      },
      {
        protocol: 'https',
        hostname: 'cdni.thespacecinema.it',
      },
      {
        protocol: 'http',
        hostname: 'www.thespacecinema.it',
      },
    ],
  },
};

export default nextConfig;
