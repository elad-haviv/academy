import type { MetadataRoute } from 'next';
import { listCourses, listTutorials, lessonRefs } from '@/lib/queries';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://academy.haviv.pro';
  const staticRoutes = ['', '/courses', '/labs', '/tutorials', '/videos', '/about', '/login', '/register'];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  for (const course of listCourses({ kind: 'course' })) {
    entries.push({ url: `${base}/courses/${course.slug}`, changeFrequency: 'monthly', priority: 0.8 });
    for (const lesson of lessonRefs(course.slug)) {
      entries.push({ url: `${base}/learn/${course.slug}/${lesson.slug}`, changeFrequency: 'monthly', priority: 0.6 });
    }
  }
  for (const lab of listCourses({ kind: 'lab' })) {
    entries.push({ url: `${base}/labs/${lab.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  }
  for (const tutorial of listTutorials()) {
    entries.push({ url: `${base}/tutorials/${tutorial.slug}`, changeFrequency: 'monthly', priority: 0.6 });
  }
  return entries;
}
