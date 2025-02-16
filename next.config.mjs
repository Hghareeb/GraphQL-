/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization where possible
  output: 'standalone',
  
  // Configure allowed image domains if you're using next/image
  images: {
    domains: ['learn.reboot01.com'],
  },

  // Add environment variables that should be exposed to the browser
  env: {
    GRAPHQL_ENDPOINT: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
  },
};

export default nextConfig;
