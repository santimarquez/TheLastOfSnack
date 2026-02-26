/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@last-of-snack/shared"],
  output: "standalone",
};

module.exports = nextConfig;
