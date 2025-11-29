/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'barberrock.es',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'www.barberrock.es',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '137.184.35.178',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
