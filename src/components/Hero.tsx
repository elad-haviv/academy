import Image from 'next/image';
import Link from 'next/link';

export function Hero({ totals }: { totals: { labs: number; lessons: number; tutorials: number } }) {
  return (
    <section className="hero">
      <Image className="burst" src="/img/burst.svg" alt="" aria-hidden width={600} height={600} priority />
      <div className="wrap hero-in">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            למידה בנגיעה · מהטלפון · בעברית
          </p>
          <h1>
            שיעור קצר.
            <br />
            ואז <em>ניסוי וטעייה</em>.
          </h1>
          <p className="lede">
            בלי פרקים ארוכים ובלי סרטון שמאבד את הפוקוס. בכל שיעור רעיון אחד, ואחריו מעבדה
            אינטראקטיבית שמגיבה לכל פעולה — גם כשהיא טעות.
          </p>
          <div className="cta-row">
            <Link className="btn lg" href="/labs/agl-field-course">
              כניסה למעבדה
            </Link>
            <Link className="ghost lg" href="/labs">
              מה יש בפנים ›
            </Link>
          </div>
          <dl className="facts">
            <div>
              <dt>מעבדות</dt>
              <dd>{totals.labs}</dd>
            </div>
            <div>
              <dt>שיעורים</dt>
              <dd>{totals.lessons}</dd>
            </div>
            <div>
              <dt>מדריכים</dt>
              <dd>{totals.tutorials}</dd>
            </div>
            <div>
              <dt>מאמת תוכן</dt>
              <dd>E. Haviv</dd>
            </div>
          </dl>
        </div>

        <div className="hero-art">
          <div className="sim">
            <div className="sim-bar">
              <span className="sim-title">AGL · מסלול 27</span>
              <span className="chip chip-ok">בהרצה</span>
              <span className="sim-clock" dir="ltr">
                02:14
              </span>
            </div>
            <div className="sim-runway">
              <Image
                src="/img/hero-agl.png"
                alt="מעגל תאורת מסלול: ארון CCR, חמישה גופי תאורה על כבל סדרתי, והשלישי כבוי עם שנאי פתוח וניצוץ בקטע הניתוק"
                width={1100}
                height={733}
                priority
              />
            </div>
            <div className="sim-panel">
              <div className="gauge">
                <span>זרם מעגל</span>
                <b dir="ltr">2.4 A</b>
                <i>
                  <u style={{ width: '38%' }} />
                </i>
              </div>
              <div className="gauge">
                <span>התנגדות</span>
                <b dir="ltr">0.8 Ω</b>
                <i>
                  <u style={{ width: '12%' }} />
                </i>
              </div>
              <div className="switches">
                <span className="sw on">CCR 1</span>
                <span className="sw on">CCR 2</span>
                <span className="sw">CCR 3</span>
              </div>
            </div>
            <div className="sim-log">
              <p>
                <span className="t" dir="ltr">
                  02:03
                </span>
                מתח ירד ב־14% בקטע 4 — קצר חלקי?
              </p>
              <p>
                <span className="t" dir="ltr">
                  02:11
                </span>
                מפסק CCR 3 נותק. המסלול כהה מ־180°.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
