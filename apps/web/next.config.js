// Ensure Next's dynamic npm install for SWC binaries runs without workspace errors
process.env.NPM_CONFIG_WORKSPACES = 'false';
process.env.npm_config_workspaces = 'false';

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
