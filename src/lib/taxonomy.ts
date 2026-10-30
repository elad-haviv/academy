import raw from './taxonomy.json';

/**
 * The fixed taxonomy (spec §2). Data lives in taxonomy.json so that
 * scripts/check-content.mjs can validate content without a TS loader —
 * this module is the typed single source of truth for the app.
 */

export type Category = { slug: string; label: string; blurb: string };
export type Track = { slug: string; label: string; blurb: string };
export type Level = { value: string; label: string };

export const CATEGORIES: Category[] = raw.categories;
export const TRACKS: Track[] = raw.tracks;
export const LEVELS: Level[] = raw.levels;
export const TAGS: string[] = raw.tags;

export const DEFAULT_CATEGORY = 'electrical';

const categoryBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));
const trackBySlug = new Map(TRACKS.map((t) => [t.slug, t]));
const levelByValue = new Map(LEVELS.map((l) => [l.value, l]));
const tagSet = new Set(TAGS);

export function isCategory(value: string): boolean {
  return categoryBySlug.has(value);
}

export function isTrack(value: string): boolean {
  return trackBySlug.has(value);
}

export function isLevel(value: string): boolean {
  return levelByValue.has(value);
}

export function isTag(value: string): boolean {
  return tagSet.has(value);
}

export function category(slug: string): Category | null {
  return categoryBySlug.get(slug) ?? null;
}

export function track(slug: string): Track | null {
  return trackBySlug.get(slug) ?? null;
}

/** Hebrew label for a category slug; returns '' for an empty slug. */
export function categoryLabel(slug: string): string {
  if (!slug) return '';
  return categoryBySlug.get(slug)?.label ?? slug;
}

/** Hebrew label for a track slug; returns '' for an empty slug. */
export function trackLabel(slug: string): string {
  if (!slug) return '';
  return trackBySlug.get(slug)?.label ?? slug;
}

/** Hebrew label for a level value; falls back to the raw value. */
export function levelLabel(value: string): string {
  return levelByValue.get(value)?.label ?? value;
}

/** Comma-joined tracks, as stored in SQLite. */
export function joinTracks(slugs: string[]): string {
  return slugs.join(', ');
}

export function splitTracks(value: string): string[] {
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

/** Normalises any author-supplied track list to known slugs, in taxonomy order. */
export function normaliseTracks(slugs: string[]): string[] {
  const wanted = new Set(slugs);
  return TRACKS.map((t) => t.slug).filter((slug) => wanted.has(slug));
}
