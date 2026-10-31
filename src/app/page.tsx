import { db, DB_FILE } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function Home() {
  const row = db().prepare('SELECT count(*) AS n FROM labs').get() as { n: number };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px' }}>
      <h1 style={{ fontSize: 40 }}>Haviv Academy</h1>
      <p style={{ fontSize: 20 }}>
        מעבדות שאפשר להפעיל, לשבור, ולאבחן.
      </p>
      <p style={{ opacity: 0.6, fontSize: 14 }}>
        scaffold v2 · database {DB_FILE} · labs {row.n}
      </p>
    </main>
  );
}
