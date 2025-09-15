const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow importing files from outside /web in this monorepo
    externalDir: true,
    // Ensure server bundling traces the monorepo root for dependencies
    outputFileTracingRoot: path.join(__dirname, '..')
  },
  async redirects() {
    return [
      { source: '/v1/generate', destination: '/generate', permanent: true },
      { source: '/hackathon-notes/generate', destination: '/generate', permanent: true },
      { source: '/explore', destination: '/notebooks', permanent: true },
      { source: '/explore/:path*', destination: '/notebooks', permanent: true },
      { source: '/blueprint', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
