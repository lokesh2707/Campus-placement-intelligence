/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@campus-os/shared-types', '@campus-os/config', '@campus-os/validation'],
};

export default nextConfig;
