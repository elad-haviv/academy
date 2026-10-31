import Link from 'next/link';
import { SiteFooter } from '@/components/Sections';
import { loadLabs } from '@/lib/labs';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Labs — Haviv Academy' };

export default function EnLabs() {
  const labs = loadLabs();
  return (
    <div className="en" dir="ltr">
      <div className="top-strip" aria-hidden="true" />
      <header className="site-header">
        <div className="wrap head-in">
          <Link className="brand" href="/en">
            <span className="brand-word">
              Haviv <em>Academy</em>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/en/labs">Labs</Link>
            <Link href="/en/pricing">Pricing</Link>
            <Link href="/en/for-employers">For employers</Link>
            <Link href="/labs">עברית</Link>
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            The product · {labs.length} labs
          </p>
          <h1>Labs</h1>
          <p className="lede">
            Each lab is a system you can run, break and diagnose. There is a fault, there are
            measurements, and there are consequences — including ones that darken an entire circuit.
          </p>
        </header>
        {labs.map((lab) => (
          <article className="en-lab-row" key={lab.slug}>
            <div>
              <span className="tag">{lab.vertical === 'gensets' ? 'Gensets' : 'Airfield lighting'}</span>
              <h2>{lab.titleEn ?? lab.title}</h2>
              <p>{lab.subtitleEn ?? lab.subtitle}</p>
              <dl className="facts">
                <div>
                  <dt>Length</dt>
                  <dd>{duration(lab.minutes)}</dd>
                </div>
                <div>
                  <dt>Correctness owner</dt>
                  <dd>{lab.correctnessOwner ?? '—'}</dd>
                </div>
                <div>
                  <dt>Validated</dt>
                  <dd>{lab.validatedOn ?? '—'}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{lab.status === 'published' ? 'Live' : 'In development'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <p className="mini-label">What breaks</p>
              <ul className="checklist fault">
                {(lab.failureModesEn ?? lab.failureModes).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>Seats for a team</h2>
              <p>From 5 seats, VAT invoice, role-based plan.</p>
            </div>
            <Link className="btn lg" href="/en/for-employers">
              Request a quote
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
