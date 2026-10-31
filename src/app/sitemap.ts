import type { MetadataRoute } from 'next';
import { allCourses, allTutorials } from '@/lib/content';
import { loadLabs } from '@/lib/labs';

const BASE = 'https://academy.haviv.pro';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = ['', '/labs', '/courses', '/tutorials', '/pricing', '/for-employers', '/register', '/login'];

  return [
    ...staticRoutes.map((p) => ({
      url: `${BASE}${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.7,
    })),
    ...loadLabs().map((l) => ({
      url: `${BASE}/labs/${l.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...allCourses().map((c) => ({
      url: `${BASE}/courses/${c.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...allTutorials().map((t) => ({
      url: `${BASE}/tutorials/${t.slug}`,
      lastModified: new Date(t.published ?? now),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
