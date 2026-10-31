import Link from 'next/link';
import Image from 'next/image';
import { SiteFooter } from '@/components/Sections';
import { loadLabs } from '@/lib/labs';
import { duration } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Haviv Academy — hands-on labs for electrical & industrial teams',
  description:
    'Interactive learning for electrical and industrial teams: a short lesson, then a simulator that answers every move. Airfield lighting and generators, in Hebrew.',
  alternates: { canonical: 'https://academy.haviv.pro/en', languages: { he: '/' } },
};

export default function EnHome() {
  const labs = loadLabs();

  return (
    <div className="en" dir="ltr">
      <div className="top-strip" aria-hidden="true" />
      <header className="site-header">
        <div className="wrap head-in">
          <Link className="brand" href="/en">
            <svg className="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
              <path d="M20 74 V22 M20 48 H60 V22 M60 48 L78 74" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="square" />
            </svg>
            <span className="brand-word">
              Haviv <em>Academy</em>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/en/labs">Labs</Link>
            <Link href="/en/pricing">Pricing</Link>
            <Link href="/en/for-employers">For employers</Link>
            <Link href="/">עברית</Link>
          </nav>
        </div>
      </header>

      <main className="wrap page">
        <section className="en-hero">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            Israel · interactive training
          </p>
          <h1>
            A short lesson.
            <br />
            Then trial and error.
          </h1>
          <p className="lede">
            No hour-long videos, no walls of text. Each lesson carries one idea, then a working
            simulator answers every move — including the wrong ones. Two labs today: airfield lighting
            series circuits and standby generators.
          </p>
          <div className="cta-row">
            <Link className="btn lg" href="/en/for-employers">
              Request a team quote
            </Link>
            <Link className="ghost lg" href="/en/labs">
              See the labs ›
            </Link>
          </div>
        </section>

        <section className="en-labs">
          {labs.map((lab) => (
            <article className="lab-card" key={lab.slug}>
              <div className="lab-art">
                <Image src={lab.cover} alt="" width={520} height={346} />
              </div>
              <div className="lab-body">
                <div className="lab-top">
                  <span className="tag">{lab.vertical === 'gensets' ? 'Gensets' : 'Airfield lighting'}</span>
                  <span className={lab.status === 'published' ? 'chip chip-ok' : 'chip chip-soon'}>
                    {lab.status === 'published' ? 'Live' : 'In development'}
                  </span>
                </div>
                <h3>{lab.titleEn ?? lab.title}</h3>
                <p className="sub">{lab.subtitleEn ?? lab.subtitle}</p>
                <ul className="checklist tight">
                  {(lab.outcomesEn ?? lab.outcomes).map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
                <div className="lab-foot">
                  <span className="owner">{duration(lab.minutes)} · Hebrew UI</span>
                  <Link className="btn sm" href="/en/pricing">
                    Access
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="en-facts">
          <div>
            <b>Correctness gate</b>
            <p>
              A lab is not published until it has a named correctness owner and a validation date. The
              simulator is the claim; someone accountable signs it.
            </p>
          </div>
          <div>
            <b>Built for teams</b>
            <p>
              Seats, VAT invoices, role-based training plans and completion reporting for maintenance
              departments, contractors and vocational colleges.
            </p>
          </div>
          <div>
            <b>Hebrew-first</b>
            <p>
              The interface, the terminology and the safety language are Hebrew. This shell is English
              for procurement, not for the training itself.
            </p>
          </div>
        </section>

        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>Training a team?</h2>
              <p>Seats from 5, VAT invoice, role-based plan, reply within one business day.</p>
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
