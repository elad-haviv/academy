import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { db, DB_FILE } from '@/lib/db';
import { loadLabs } from '@/lib/labs';

export const dynamic = 'force-dynamic';

/** Diagnostic endpoint: what the running container actually sees. */
export function GET() {
  const checks: Record<string, unknown> = {
    buildId: process.env.NEXT_BUILD_ID ?? null,
    node: process.version,
    dataDir: process.env.ACADEMY_DATA_DIR ?? null,
    dbFile: DB_FILE,
    dbFileExists: fs.existsSync(DB_FILE),
    contentDirExists: fs.existsSync(path.join(process.cwd(), 'content', 'labs')),
  };

  let ok = true;

  try {
    const row = db().prepare('SELECT count(*) AS n FROM courses').get() as { n: number };
    checks.courses = row.n;
  } catch (err) {
    ok = false;
    checks.dbError = err instanceof Error ? err.message : String(err);
  }

  try {
    checks.labs = loadLabs().length;
  } catch (err) {
    ok = false;
    checks.labsError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
