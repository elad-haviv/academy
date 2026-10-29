import Link from 'next/link';
import type { Metadata } from 'next';
import { formatDate, pad2 } from '@/lib/format';
import { allTags, listTutorials } from '@/lib/queries';

export const metadata: Metadata = { title: 'מדריכים' };

export default function TutorialsPage({ searchParams }: { searchParams: { tag?: string; q?: string } }) {
  const tag = searchParams.tag ?? '';
  const q = searchParams.q ?? '';
  const tutorials = listTutorials({ tag, q });
  const tags = allTags();

  return (
    <>
      <div className="page-head">
        <div className="wrap">
          <h1>מדריכים</h1>
          <p>פתרונות קצרים לבעיות אמיתיות: פקודה, הסבר, ולמה זה עובד ככה. בלי הקדמות ובלי סיפורי רקע.</p>
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 72 }}>
        <form className="filters" method="get" role="search">
          <label className="sr-only" htmlFor="q">
            חיפוש מדריך
          </label>
          <input id="q" type="search" name="q" defaultValue={q} placeholder="חיפוש במדריכים…" />
          {tag ? <input type="hidden" name="tag" value={tag} /> : null}
          <button type="submit" className="btn small">
            חיפוש
          </button>
          <span className="count">{tutorials.length} מדריכים</span>
        </form>

        <div className="chips">
          <Link href="/tutorials" data-active={tag ? 'false' : 'true'}>
            הכל
          </Link>
          {tags.map((topic) => (
            <Link
              key={topic}
              href={`/tutorials?tag=${encodeURIComponent(topic)}`}
              data-active={tag === topic ? 'true' : 'false'}
            >
              {topic}
            </Link>
          ))}
        </div>

        {tutorials.length ? (
          <div className="ledger">
            {tutorials.map((tutorial, index) => (
              <div className="ledger-row" key={tutorial.slug}>
                <div className="idx">{pad2(index + 1)}</div>
                <div>
                  <Link href={`/tutorials/${tutorial.slug}`} className="title">
                    {tutorial.title}
                  </Link>
                  <div className="desc">{tutorial.excerpt}</div>
                  <div className="tags">
                    {tutorial.tags.map((item) => (
                      <span className="tag" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="level">
                  <b>{formatDate(tutorial.published)}</b>
                  <span>{tutorial.minutes} דק׳ קריאה</span>
                </div>
                <div className="cta">
                  <Link href={`/tutorials/${tutorial.slug}`} className="btn ghost small">
                    לקריאה
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <h3>לא נמצאו מדריכים</h3>
            <p>נסו מילה אחרת, או עברו לרשימה המלאה.</p>
            <Link href="/tutorials" className="btn ghost small">
              לכל המדריכים
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
