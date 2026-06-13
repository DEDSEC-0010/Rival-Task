/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output lets the production Docker image ship only what the
  // server actually needs at runtime. `next start` still works for non-Docker
  // hosts (Render etc.) — this is purely additive.
  output: "standalone",
};

export default nextConfig;
