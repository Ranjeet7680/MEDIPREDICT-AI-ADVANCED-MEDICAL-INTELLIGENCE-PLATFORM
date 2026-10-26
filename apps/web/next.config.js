/** @type {import('next').NextConfig} */
const backendUrl =
  process.env.BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith("/")
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, "")
    : process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:8000"
    : "");

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  async rewrites() {
    if (!backendUrl) {
      return [];
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
