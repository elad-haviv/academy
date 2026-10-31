import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/', '/labs/*/play'] }],
    sitemap: 'https://academy.haviv.pro/sitemap.xml',
    host: 'https://academy.haviv.pro',
  };
}
