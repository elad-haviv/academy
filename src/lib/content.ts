import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type ContentAccess = 'free' | 'premium';

export type LessonSeed = {
  slug: string;
  title: string;
  minutes: number;
  body: string;
  /** '' = inherit the course default (spec §1.3). */
  access: '' | ContentAccess;
  isPreview: boolean;
  videoUrl: string | null;
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
  status: 'published' | 'in-development' | 'draft' | 'review';
  category: string;
  tracks: string[];
  access: ContentAccess;
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
  category: string;
  tracks: string[];
  access: ContentAccess;
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

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function boolish(value: unknown): boolean {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function contentAccess(value: unknown, fallback: ContentAccess | ''): ContentAccess | '' {
  return value === 'premium' || value === 'free' ? value : fallback;
}

function seedStatus(value: unknown): CourseSeed['status'] {
  if (value === 'in-development' || value === 'draft' || value === 'review') return value;
  return 'published';
}

function readCourseDir(slug: string): CourseSeed | null {
  const dir = path.join(CONTENT_DIR, 'courses', slug);
  const metaPath = path.join(dir, 'course.json');
  if (!fs.existsSync(metaPath)) return null;
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const access: ContentAccess = contentAccess(meta.access, 'free') === 'premium' ? 'premium' : 'free';
  const modules: ModuleSeed[] = (meta.modules ?? []).map((m: any) => ({
    title: m.title,
    summary: m.summary ?? '',
    lessons: (m.lessons ?? []).map((l: any) => {
      const file = path.join(dir, l.file);
      const rawBody = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
      // Lesson frontmatter (optional) overrides course.json — spec §1.2.
      const { data: fm, body } = readFrontmatter(rawBody);
      return {
        slug: l.slug,
        title: l.title,
        minutes: Number(l.minutes ?? 10),
        body,
        access: contentAccess(fm.access ?? l.access, '') as '' | ContentAccess,
        isPreview: boolish(fm.is_preview ?? l.is_preview),
        videoUrl: (fm.video_url ?? l.video_url ?? null) as string | null,
      };
    }),
  }));
  return {
    slug,
    title: meta.title,
    subtitle: meta.subtitle ?? '',
    description: meta.description ?? '',
    level: meta.level ?? 'Beginner',
    language: meta.language ?? 'en',
    tags: splitList(meta.tags),
    kind: meta.kind === 'lab' ? 'lab' : 'course',
    externalUrl: meta.externalUrl ?? null,
    status: seedStatus(meta.status),
    category: typeof meta.category === 'string' ? meta.category : '',
    tracks: splitList(meta.tracks),
    access,
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
        tags: splitList(data.tags),
        level: data.level ?? 'Beginner',
        minutes: Number(data.minutes ?? 5),
        published: data.published ?? '',
        category: data.category ?? '',
        tracks: splitList(data.tracks),
        access: contentAccess(data.access, 'free') === 'premium' ? 'premium' : 'free',
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
