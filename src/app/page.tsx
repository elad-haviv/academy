import Link from 'next/link';
import { LedgerRow } from '@/components/LedgerRow';
import { formatDate, formatMinutes, pad2 } from '@/lib/format';
import { listCourses, listTutorials, siteStats } from '@/lib/queries';

export default function HomePage() {
  const courses = listCourses({ kind: 'course' });
  const featured = courses.filter((c) => c.featured).slice(0, 4);
  const spotlight = (featured.length ? featured : courses).slice(0, 4);
  const labs = listCourses({ kind: 'lab' });
  const tutorials = listTutorials().slice(0, 4);
  const stats = siteStats();

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <h1>כאן לומדים את מה שעובד בשטח.</h1>
            <p className="lede">
              קורסים, מדריכים קצרים ומעבדות אינטראקטיביות בהנדסה, בחשמל ובפיתוח תוכנה — בעברית, בקצב שלך, בלי רעש מסביב.
            </p>
            <div className="hero-actions">
              <Link href="/courses" className="btn">
                לקטלוג הקורסים
              </Link>
              <Link href="/labs" className="btn ghost">
                מעבדות אינטראקטיביות
              </Link>
            </div>
          </div>
          <div className="hero-ledger">
            <div className="caption">בקטלוג עכשיו</div>
            <ul>
              {spotlight.map((course, index) => (
                <li key={course.slug}>
                  <span className="idx">{pad2(index + 1)}</span>
                  <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                  <span className="meta">{formatMinutes(course.minutes)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="stat-strip">
          <div>
            <b>{stats.courses}</b>
            <span>קורסים</span>
          </div>
          <div>
            <b>{stats.lessons}</b>
            <span>שיעורים</span>
          </div>
          <div>
            <b>{stats.labs}</b>
            <span>מעבדות</span>
          </div>
          <div>
            <b>{stats.tutorials}</b>
            <span>מדריכים</span>
          </div>
          <div>
            <b>{stats.hours}</b>
            <span>שעות תוכן</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>קורסים</h2>
              <p>כל קורס בנוי ממודולים קצרים. קוראים, מתרגלים, מסמנים שהשיעור הושלם — וההתקדמות נשמרת בחשבון שלך.</p>
            </div>
            <Link href="/courses" className="more">
              כל הקורסים ({courses.length})
            </Link>
          </div>
          <div className="ledger">
            {spotlight.map((course, index) => (
              <LedgerRow key={course.slug} course={course} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>מעבדות</h2>
              <p>
                לא עוד סרטון שמסבירים עליו. במעבדות מריצים סימולציה, לוחצים על הרכיבים, טועים, ומתקנים — עד שההבנה נכנסת לידיים.
              </p>
            </div>
            <Link href="/labs" className="more">
              כל המעבדות
            </Link>
          </div>
          <div className="cards">
            {labs.map((lab) => (
              <article className="card" key={lab.slug}>
                <h3>{lab.title}</h3>
                <p>{lab.subtitle}</p>
                <div className="card-foot">
                  <span className="stat">{lab.status === 'in-development' ? 'בבנייה' : 'פתוח ללימוד'}</span>
                  <Link href={`/labs/${lab.slug}`} className="btn ghost small">
                    {lab.status === 'in-development' ? 'מה בתכנון' : 'להיכנס למעבדה'}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>מדריכים</h2>
              <p>פתרונות קצרים לבעיות שנתקלים בהן באמצע העבודה. חמש דקות קריאה, בלי הקדמות.</p>
            </div>
            <Link href="/tutorials" className="more">
              כל המדריכים
            </Link>
          </div>
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
                    {tutorial.tags.slice(0, 3).map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
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
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="notice" style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px' }}>
              <h3 style={{ marginBottom: 6 }}>פותחים חשבון כדי לשמור התקדמות</h3>
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.94rem' }}>
                הקורסים פתוחים לכולם. חשבון חינמי שומר איפה עצרת, אילו שיעורים סימנת ואילו קורסים התחלת — בכל מכשיר.
              </p>
            </div>
            <Link href="/register" className="btn">
              פתיחת חשבון
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
