/** @type {import('next').NextConfig} */
const nextConfig = {
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
