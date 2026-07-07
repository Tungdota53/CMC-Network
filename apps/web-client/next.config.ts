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

    return [
      {
        source: '/api/ai/:path*',
        destination: 'http://localhost:8000/api/v1/:path*',
      },
      {
        source: '/api/posts/upload',
        destination: `${postsApiUrl}/posts/upload`,
      },
      {
        source: '/api/users/:id/avatar',
        destination: `${userApiUrl}/users/:id/avatar`,
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
        source: '/uploads/posts/:path*',
        destination: `${postsApiUrl}/uploads/posts/:path*`,
      },
      {
        source: '/uploads/products/:path*',
        destination: `http://localhost:3008/uploads/products/:path*`,
      },
      {
        source: '/uploads/materials/:path*',
        destination: `http://localhost:3007/uploads/materials/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${postsApiUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
