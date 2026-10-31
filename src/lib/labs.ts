import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

export type Lab = {
  slug: string;
  title: string;
  subtitle: string;
  vertical: string;
  kind: string;
  status: 'published' | 'in-development' | string;
  entitlement: string;
  embedUrl: string | null;
  correctnessOwner: string | null;
  validatedOn: string | null;
  cover: string;
  learnerRoles: string[];
  buyerRoles: string[];
  outcomes: string[];
  failureModes: string[];
  prerequisites: string[];
  minutes: number;
  position: number;
  /** English shell fields — the training content itself stays Hebrew. */
  titleEn?: string;
  subtitleEn?: string;
  outcomesEn?: string[];
  failureModesEn?: string[];
  prerequisitesEn?: string[];
};

const LABS_DIR = path.join(process.cwd(), 'content', 'labs');

/**
 * Labs are the product. They are read from disk (content/labs/<slug>/lab.json)
 * and, from Phase 3 on, seeded into the `labs` table on boot. A lab without a
 * correctnessOwner and a validatedOn date is not publishable — that rule is
 * enforced here rather than trusted to the author.
 */
export function loadLabs(): Lab[] {
  if (!fs.existsSync(LABS_DIR)) return [];
  const labs = fs
    .readdirSync(LABS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = path.join(LABS_DIR, d.name, 'lab.json');
      if (!fs.existsSync(file)) return null;
      return JSON.parse(fs.readFileSync(file, 'utf8')) as Lab;
    })
    .filter((l): l is Lab => l !== null);

  const merged = [...labs, ...dbLabs().filter((d) => !labs.some((f) => f.slug === d.slug))];
  return merged.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
}

export function isPublishable(lab: Lab): boolean {
  return Boolean(lab.correctnessOwner && lab.validatedOn);
}

/**
 * Labs registered through the studio live in SQLite and point at a git repo.
 * They are public only while status='published' AND validation_state='validated'
 * AND the validated ref is still the current one — a push to the lab repo makes
 * the lab stale and hides it until an editor re-validates. (See lib/studio.ts.)
 */
type LabRow = {
  slug: string;
  title: string;
  subtitle: string | null;
  vertical: string | null;
  status: string;
  entitlement: string;
  embed_url: string | null;
  repo_url: string | null;
  repo_ref: string | null;
  validation_state: string;
  last_validated_ref: string | null;
  correctness_owner: string | null;
  validated_on: string | null;
  outcomes: string;
  failure_modes: string;
  learner_roles: string;
  buyer_roles: string;
  prerequisites: string;
  minutes: number;
  position: number;
};

function parseJson(value: string | null): string[] {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function dbLabs(includeUnpublished = false): Lab[] {
  let rows: LabRow[];
  try {
    rows = db().prepare('SELECT * FROM labs ORDER BY position ASC, title ASC').all() as unknown as LabRow[];
  } catch {
    return [];
  }
  return rows
    .filter((r) => includeUnpublished || (r.status === 'published' && r.validation_state === 'validated' && r.last_validated_ref === r.repo_ref))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle ?? '',
      vertical: r.vertical ?? 'agl',
      kind: 'simulator',
      status: r.status,
      entitlement: r.entitlement || `lab:${r.slug}`,
      embedUrl: r.embed_url,
      correctnessOwner: r.correctness_owner,
      validatedOn: r.validated_on,
      cover: '/img/cover-agl.png',
      learnerRoles: parseJson(r.learner_roles),
      buyerRoles: parseJson(r.buyer_roles),
      outcomes: parseJson(r.outcomes),
      failureModes: parseJson(r.failure_modes),
      prerequisites: parseJson(r.prerequisites),
      minutes: r.minutes,
      position: 100 + (r.position ?? 0),
    }));
}

/** Public lab list: vendored file labs + studio labs that pass the validation gate. */
export function publicLabs(): Lab[] {
  const fromFiles = loadLabs().filter((l) => l.status === 'published');
  const fromDb = dbLabs(false);
  const seen = new Set(fromFiles.map((l) => l.slug));
  return [...fromFiles, ...fromDb.filter((l) => !seen.has(l.slug))];
}
