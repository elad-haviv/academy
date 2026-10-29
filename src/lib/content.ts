import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type LessonSeed = {
  slug: string;
  title: string;
  minutes: number;
  body: string;
};

export type ModuleSeed = {
  title: string;
  summary: string;
  lessons: LessonSeed[];
};

export type CourseSeed = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  tags: string[];
  kind: 'course' | 'lab';
  externalUrl: string | null;
  status: 'published' | 'in-development';
  featured: boolean;
  sort: number;
  modules: ModuleSeed[];
};

export type TutorialSeed = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  level: string;
  minutes: number;
  published: string;
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {} as Record<string, string>, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

function readCourseDir(slug: string): CourseSeed | null {
  const dir = path.join(CONTENT_DIR, 'courses', slug);
  const metaPath = path.join(dir, 'course.json');
  if (!fs.existsSync(metaPath)) return null;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const modules: ModuleSeed[] = (meta.modules ?? []).map((m: any) => ({
    title: m.title,
    summary: m.summary ?? '',
    lessons: (m.lessons ?? []).map((l: any) => {
      const file = path.join(dir, l.file);
      const body = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      return { slug: l.slug, title: l.title, minutes: Number(l.minutes ?? 10), body };
    }),
  }));
  return {
    slug,
    title: meta.title,
    subtitle: meta.subtitle ?? '',
    description: meta.description ?? '',
    level: meta.level ?? 'Beginner',
    language: meta.language ?? 'en',
    tags: meta.tags ?? [],
    kind: meta.kind === 'lab' ? 'lab' : 'course',
    externalUrl: meta.externalUrl ?? null,
    status: meta.status === 'in-development' ? 'in-development' : 'published',
    featured: Boolean(meta.featured),
    sort: Number(meta.sort ?? 99),
    modules,
  };
}

function readTutorials(): TutorialSeed[] {
  const dir = path.join(CONTENT_DIR, 'tutorials');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => {
      const { data, body } = readFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        slug: f.replace(/\.md$/, ''),
        title: data.title ?? f,
        excerpt: data.excerpt ?? '',
        tags: (data.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
        level: data.level ?? 'Beginner',
        minutes: Number(data.minutes ?? 5),
        published: data.published ?? '',
        body,
      };
    });
}

export type ContentBundle = {
  courses: CourseSeed[];
  tutorials: TutorialSeed[];
  hash: string;
};

export function loadContent(): ContentBundle {
  const coursesDir = path.join(CONTENT_DIR, 'courses');
  const slugs = fs.existsSync(coursesDir)
    ? fs.readdirSync(coursesDir).filter((name) => fs.existsSync(path.join(coursesDir, name, 'course.json')))
    : [];
  const courses = slugs
    .map(readCourseDir)
    .filter((c): c is CourseSeed => Boolean(c))
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
  const tutorials = readTutorials().sort((a, b) => (a.published < b.published ? 1 : -1));

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ courses, tutorials }))
    .digest('hex')
    .slice(0, 16);

  return { courses, tutorials, hash };
}
