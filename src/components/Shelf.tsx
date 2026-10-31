import Link from 'next/link';
import type { CourseRow } from '@/lib/courses';

export function Shelf({ courses }: { courses: CourseRow[] }) {
  if (courses.length === 0) {
    return (
      <section className="wrap shelf">
        <div className="sec-head">
          <h2>על המדף</h2>
        </div>
        <p className="note">הקורסים בעבודה. בינתיים — המעבדות פתוחות.</p>
      </section>
    );
  }

  return (
    <section className="wrap shelf">
      <div className="sec-head">
        <h2>על המדף</h2>
        <Link className="sec-link" href="/courses">
          כל הקורסים ›
        </Link>
      </div>
      {courses.map((c, i) => (
        <Link className="row" key={c.slug} href={`/courses/${c.slug}`}>
          <span className="n">{String(i + 1).padStart(2, '0')}</span>
          <span className="r-title">{c.title}</span>
          <span className="r-desc">{c.subtitle || c.description}</span>
          <span className="r-meta">{c.lesson_count} שיעורים</span>
          <span className="r-meta">{c.minutes} דק׳</span>
          <span className="r-arrow" aria-hidden="true">
            ›
          </span>
        </Link>
      ))}
    </section>
  );
}

export function Steps() {
  return (
    <section className="how">
      <div className="wrap">
        <div className="sec-head">
          <h2>מה קורה בפנים</h2>
        </div>
        <ol className="steps">
          <li>
            <span className="num">01</span>
            <b>מקבלים תקלה</b>
            <p>תרחיש עם סימפטום, לא עם תשובה. המסלול כבוי בקטע אחד ואתה לא יודע למה.</p>
          </li>
          <li>
            <span className="num">02</span>
            <b>מודדים ומשערים</b>
            <p>זרם, התנגדות, רציפות. כל פעולה משנה את המערכת, כולל פעולות שגויות.</p>
          </li>
          <li>
            <span className="num">03</span>
            <b>מתקנים ומוודאים</b>
            <p>התיקון נבדק מול מצב המערכת. תיקון שנראה נכון אבל מפיל קטע אחר — נכשל.</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
