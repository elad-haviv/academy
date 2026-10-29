import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/format';
import { getTutorial, listTutorials } from '@/lib/queries';
import { renderMarkdown } from '@/lib/markdown';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const tutorial = getTutorial(params.slug);
  return { title: tutorial ? tutorial.title : 'מדריך', description: tutorial?.excerpt };
}

export default function TutorialPage({ params }: { params: { slug: string } }) {
  const tutorial = getTutorial(params.slug);
  if (!tutorial) notFound();
  const related = listTutorials().filter((item) => item.slug !== tutorial.slug).slice(0, 3);

  return (
    <div className="wrap course-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 260px' }}>
      <article className="course-body">
        <div className="crumb mono" style={{ fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
          {formatDate(tutorial.published)} · {tutorial.minutes} דקות קריאה · {tutorial.level === 'Beginner' ? 'מתחילים' : tutorial.level}
        </div>
        <h1 style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)', marginTop: 10 }}>{tutorial.title}</h1>
        <p className="sub" style={{ color: 'var(--ink-soft)', marginTop: 12 }}>{tutorial.excerpt}</p>
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(tutorial.body) }} />
        <div className="lesson-foot">
          <Link href="/tutorials" className="navlink">
            <span>חזרה</span>
            כל המדריכים
          </Link>
          <Link href="/courses" className="btn ghost small">
            לקורסים המלאים
          </Link>
        </div>
      </article>

      <aside className="side-panel">
        <h3>עוד באותו נושא</h3>
        <ul className="lesson-list">
          {related.map((item) => (
            <li key={item.slug}>
              <Link href={`/tutorials/${item.slug}`}>
                <span>{item.title}</span>
                <span className="min">{item.minutes} דק׳</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="tags" style={{ marginTop: 16 }}>
          {tutorial.tags.map((tag) => (
            <Link className="tag" key={tag} href={`/tutorials?tag=${encodeURIComponent(tag)}`}>
              {tag}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
