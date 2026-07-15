import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CMC Network',
    short_name: 'CMC Network',
    description: 'Nền tảng kết nối sinh viên CMC University.',
    start_url: '/feed',
    scope: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/new-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
