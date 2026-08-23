/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kairo/contracts", "@kairo/design-tokens"],
};

// Production deployment explicitly approved on 2026-08-24.
export default nextConfig;
