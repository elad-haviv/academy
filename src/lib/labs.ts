import fs from 'node:fs';
import path from 'node:path';

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

  return labs.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
}

export function isPublishable(lab: Lab): boolean {
  return Boolean(lab.correctnessOwner && lab.validatedOn);
}
