import type { NextConfig } from "next";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.replace(/\/$/, '') || '';
const LAN_ORIGIN = process.env.NEXT_PUBLIC_LAN_ORIGIN;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'tent-pit-server-slide.trycloudflare.com',
    'choir-arrival-configurations-independence.trycloudflare.com',
    '172.17.161.244',
    '172.17.163.109',
    ...(LAN_ORIGIN ? [LAN_ORIGIN, LAN_ORIGIN.replace(/https?:\/\//, '').split(':')[0]] : []),
  ],
  async rewrites() {
    if (!API_GATEWAY_URL) return [];

    const userApiUrl = process.env.USER_API_URL?.replace(/\/$/, '') || 'http://localhost:3003';
    const postsApiUrl = process.env.POSTS_API_URL?.replace(/\/$/, '') || 'http://localhost:3004';
    const chatApiUrl = process.env.CHAT_API_URL?.replace(/\/$/, '') || 'http://localhost:3005';
    const materialApiUrl = process.env.MATERIAL_API_URL?.replace(/\/$/, '') || 'http://localhost:3007';
    const marketplaceApiUrl = process.env.MARKETPLACE_API_URL?.replace(/\/$/, '') || 'http://localhost:3008';

    return [
      {
        source: '/api/socket.io',
        destination: `${chatApiUrl}/socket.io/`,
      },
      {
        source: '/api/socket.io/:path*',
        destination: `${chatApiUrl}/socket.io/:path*`,
      },
      {
        source: '/socket.io',
        destination: `${chatApiUrl}/socket.io/`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${chatApiUrl}/socket.io/:path*`,
      },
      {
        source: '/api/ai/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/api/posts/upload',
        destination: `${postsApiUrl}/posts/upload`,
      },
      {
        source: '/api/:path*',
        destination: `${API_GATEWAY_URL}/:path*`,
      },
      {
        source: '/avatars/:path*',
        destination: `${userApiUrl}/avatars/:path*`,
      },
      {
        source: '/covers/:path*',
        destination: `${userApiUrl}/covers/:path*`,
      },
      {
        source: '/uploads/posts/:path*',
        destination: `${postsApiUrl}/uploads/posts/:path*`,
      },
      {
        source: '/uploads/products/:path*',
        destination: `${marketplaceApiUrl}/uploads/products/:path*`,
      },
      {
        source: '/uploads/materials/:path*',
        destination: `${materialApiUrl}/uploads/materials/:path*`,
      },
      {
        source: '/uploads/chat/:path*',
        destination: `${chatApiUrl}/uploads/chat/:path*`,
      },
      {
        source: '/uploads/clubs/:path*',
        destination: `${userApiUrl}/uploads/clubs/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${postsApiUrl}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    // HTML pages must not be cached long-term: each build produces new asset
    // hashes, and a stale cached HTML would reference deleted JS/CSS chunks
    // (broken fonts/layout). Do not override /_next/static Cache-Control;
    // Next.js manages immutable asset caching automatically.
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
