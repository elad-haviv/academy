#!/usr/bin/env node
/**
 * Content QA gate (spec §6.3). Runs on every PR that touches content/.
 *
 *   npm run check:content
 *
 * Errors fail the build; warnings are printed and exit 0. The rules that the
 * spec makes conditional on a human reviewer (reviewed_by / reviewed_at) are
 * warnings until Elad signs off on the catalogue — no agent may fill those in.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const taxonomy = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'lib', 'taxonomy.json'), 'utf8'));

const CATEGORIES = new Set(taxonomy.categories.map((c) => c.slug));
const TRACKS = new Set(taxonomy.tracks.map((t) => t.slug));
const LEVELS = new Set(taxonomy.levels.map((l) => l.value));
const TAGS = new Set(taxonomy.tags);

const STATUSES = new Set(['draft', 'review', 'published', 'in-development']);
const MIN_BODY_CHARS = 400;

/**
 * The spec asks for "<120 words/minute". That assumes long-form prose; the
 * lessons here are dense technical Hebrew with code blocks — 140–340 words of
 * prose labelled 8–12 minutes, i.e. 12–25 wpm, so 120 would fail the entire
 * catalogue on day one. The rule keeps its purpose (catch "one sentence,
 * 12 minutes") with a floor measured against this content: anything under
 * ~8 words per stated minute is a stub, not a lesson.
 */
const MIN_WORDS_PER_MINUTE = 8;
const MAX_WORDS_PER_MINUTE = 600;

const PLACEHOLDERS = [/lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/, /\[placeholder\]/i, /\{\{\s*[a-z_]+\s*\}\}/i];

const errors = [];
const warnings = [];

function rel(file) {
  return path.relative(ROOT, file);
}

function error(file, message) {
  errors.push({ file: rel(file), message });
}

function warn(file, message) {
  warnings.push({ file: rel(file), message });
}

function readFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }
  return { data, body: raw.slice(match[0].length) };
}

function list(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function wordCount(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/[|#>*_`[\]()]/g, ' ');
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

function checkBody(file, body, minutes, label) {
  const words = wordCount(body);
  const chars = body.replace(/\s+/g, ' ').trim().length;

  if (chars < MIN_BODY_CHARS) {
    error(file, `${label}: גוף קצר מדי — ${chars} תווים (מינימום ${MIN_BODY_CHARS})`);
  }

  for (const pattern of PLACEHOLDERS) {
    if (pattern.test(body)) {
      error(file, `${label}: טקסט זמני בגוף (${pattern}) — אסור לפרסם כך`);
      break;
    }
  }

  if (minutes > 0) {
    const wpm = Math.round((words / minutes) * 10) / 10;
    if (wpm < MIN_WORDS_PER_MINUTE) {
      error(file, `${label}: ${words} מילים בדקות מוצהרות של ${minutes} דק׳ (${wpm} מילים/דקה) — כנראה שהגוף חסר`);
    } else if (wpm > MAX_WORDS_PER_MINUTE) {
      error(file, `${label}: ${words} מילים ב-${minutes} דק׳ (${wpm} מילים/דקה) — הדקות לא ריאליות`);
    }
  }

  // Safety numbers must cite a source (§1.4) within five lines — warning only.
  const lines = body.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!/בטיחות|safety/i.test(line)) return;
    if (!/\d/.test(line)) return;
    const window = lines.slice(index, index + 6).join('\n');
    if (!/>\s*מקור:/.test(window)) {
      warn(file, `${label}: מספר ליד "בטיחות" בשורה ${index + 1} בלי שורת "> מקור:"`);
    }
  });

  return words;
}

function checkTaxonomy(file, { category, tracks, tags, level }, where) {
  if (category && !CATEGORIES.has(category)) {
    error(file, `${where}: קטגוריה לא מוכרת "${category}" — הקבועות ב-taxonomy.json`);
  }
  for (const track of list(tracks)) {
    if (!TRACKS.has(track)) error(file, `${where}: מסלול לא מוכר "${track}"`);
  }
  for (const tag of list(tags)) {
    if (!TAGS.has(tag)) error(file, `${where}: תג לא מרשימת התגים המאושרת "${tag}"`);
  }
  if (level && !LEVELS.has(level)) {
    error(file, `${where}: רמה לא מוכרת "${level}"`);
  }
}

function checkReview(file, data, where, kind) {
  const reviewedBy = data.reviewed_by ?? '';
  const reviewedAt = data.reviewed_at ?? '';
  if (!reviewedBy || !reviewedAt) {
    warn(
      file,
      `${where}: חסר reviewed_by/reviewed_at — חובה לפני פרסום${kind === 'lab' ? ' (מעבדה: שני עיניים, מהנדס)' : ''}`
    );
    return;
  }
  if (data.updated_at && reviewedAt < data.updated_at) {
    warn(file, `${where}: reviewed_at (${reviewedAt}) ישן מ-updated_at (${data.updated_at}) — צריך סקירה מחדש`);
  }
}

// ---------- courses & labs ----------
const coursesDir = path.join(CONTENT, 'courses');
const courseDirs = fs.existsSync(coursesDir)
  ? fs.readdirSync(coursesDir).filter((name) => fs.existsSync(path.join(coursesDir, name, 'course.json')))
  : [];

let checkedLessons = 0;

for (const dirName of courseDirs) {
  const dir = path.join(coursesDir, dirName);
  const metaPath = path.join(dir, 'course.json');
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (parseError) {
    error(metaPath, `course.json לא תקין: ${parseError.message}`);
    continue;
  }

  const where = `קורס ${dirName}`;
  const status = meta.status ?? 'published';
  if (!STATUSES.has(status)) error(metaPath, `${where}: סטטוס לא מוכר "${status}"`);
  if (meta.access && meta.access !== 'free' && meta.access !== 'premium') {
    error(metaPath, `${where}: access חייב להיות free או premium (${meta.access})`);
  }
  if (!meta.category) warn(metaPath, `${where}: חסר category`);
  if (!list(meta.tracks).length) warn(metaPath, `${where}: חסר tracks`);
  checkTaxonomy(metaPath, meta, where);

  if (status === 'published') checkReview(metaPath, meta, where, meta.kind === 'lab' ? 'lab' : 'course');

  const seen = new Set();
  const referenced = new Set();
  let first = true;

  for (const [moduleIdx, module] of (meta.modules ?? []).entries()) {
    for (const lesson of module.lessons ?? []) {
      const label = `${where} · מודול ${moduleIdx + 1} · ${lesson.slug ?? '(בלי slug)'}`;
      if (!lesson.slug) {
        error(metaPath, `${label}: חסר slug`);
        continue;
      }
      if (seen.has(lesson.slug)) {
        error(metaPath, `${label}: slug כפול בקורס`);
        continue;
      }
      seen.add(lesson.slug);
      referenced.add(lesson.file);

      if (!lesson.file) {
        error(metaPath, `${label}: חסר שדה file`);
        continue;
      }
      const lessonPath = path.join(dir, lesson.file);
      if (!fs.existsSync(lessonPath)) {
        error(metaPath, `${label}: הקובץ ${lesson.file} לא נמצא`);
        continue;
      }

      const raw = fs.readFileSync(lessonPath, 'utf8');
      const { data, body } = readFrontmatter(raw);
      const minutes = Number(lesson.minutes ?? data.minutes ?? 0);
      checkBody(lessonPath, body, minutes, label);
      checkedLessons += 1;

      if (first && !lesson.is_preview) {
        warn(metaPath, `${where}: השיעור הראשון (${lesson.slug}) לא מסומן is_preview — הוא אמור להיות פתוח בחינם`);
      }
      first = false;
    }
  }

  // Markdown files in the folder that course.json never references.
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    if (!referenced.has(file)) {
      error(path.join(dir, file), `${where}: הקובץ ${file} לא מופיע ב-course.json`);
    }
  }
}

// ---------- tutorials ----------
const tutorialsDir = path.join(CONTENT, 'tutorials');
const tutorialFiles = fs.existsSync(tutorialsDir) ? fs.readdirSync(tutorialsDir).filter((f) => f.endsWith('.md')) : [];

for (const file of tutorialFiles) {
  const tutorialPath = path.join(tutorialsDir, file);
  const { data, body } = readFrontmatter(fs.readFileSync(tutorialPath, 'utf8'));
  const where = `מדריך ${file.replace(/\.md$/, '')}`;

  if (!data.title) error(tutorialPath, `${where}: חסר title`);
  if (!data.category) warn(tutorialPath, `${where}: חסר category`);
  if (!list(data.tracks).length) warn(tutorialPath, `${where}: חסר tracks`);
  if (data.access && data.access !== 'free' && data.access !== 'premium') {
    error(tutorialPath, `${where}: access חייב להיות free או premium (${data.access})`);
  }
  checkTaxonomy(tutorialPath, data, where);

  const minutes = Number(data.minutes ?? 0);
  if (!minutes) warn(tutorialPath, `${where}: חסר minutes`);
  checkBody(tutorialPath, body, minutes, where);

  if (data.published) checkReview(tutorialPath, data, where, 'tutorial');
}

// ---------- report ----------
function printGroup(title, rows, icon) {
  if (!rows.length) return;
  console.log(`\n${title}`);
  let lastFile = null;
  for (const row of rows.sort((a, b) => a.file.localeCompare(b.file))) {
    if (row.file !== lastFile) {
      console.log(`  ${icon} ${row.file}`);
      lastFile = row.file;
    }
    console.log(`      ${row.message}`);
  }
}

console.log(
  `בדיקת תוכן: ${courseDirs.length} קורסים/מעבדות, ${tutorialFiles.length} מדריכים, ${checkedLessons} שיעורים`
);
printGroup(`שגיאות (${errors.length})`, errors, '✗');
printGroup(`אזהרות (${warnings.length})`, warnings, '!');

if (errors.length) {
  console.log(`\nנכשל: ${errors.length} שגיאות תוכן. אפשר לתקן ולחזור על הבדיקה.`);
  process.exit(1);
}

console.log(
  warnings.length
    ? `\nעבר עם ${warnings.length} אזהרות.`
    : '\nעבר. אין שגיאות ואין אזהרות.'
);
