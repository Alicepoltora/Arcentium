/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Kit и его адаптеры — серверные пакеты, нельзя бандлить на клиенте
  serverExternalPackages: [
    "@circle-fin/app-kit",
    "@circle-fin/adapter-viem-v2",
    "@circle-fin/adapter-solana",
  ],
};

export default nextConfig;
