import Link from 'next/link';
import { SiteFooter } from '@/components/Sections';

export const metadata = { title: 'Pricing — Haviv Academy' };

export default function EnPricing() {
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
            <Link href="/pricing">עברית</Link>
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            VAT included · 14-day cancellation
          </p>
          <h1>Pricing</h1>
          <p className="lede">
            One plan, two billing cycles. The labs are the product, so they sit behind the paid plan —
            tutorials and the first lesson of every course stay free.
          </p>
        </header>

        <p className="plans-hint">Swipe through the plans</p>
        <div className="plans en-plans">
          <div className="plan">
            <b className="name">Free</b>
            <span className="pnum">₪0</span>
            <p>All written tutorials, the first lesson of each course, full catalogue.</p>
            <Link className="btn ghosted" href="/tutorials">
              Browse tutorials
            </Link>
          </div>
          <div className="plan plan-hi">
            <span className="plan-tag">Recommended</span>
            <b className="name">Annual</b>
            <span className="pnum">₪349</span>
            <span className="per">per year · ₪29 / month effective</span>
            <p>Every lesson, both labs, all attachments. 7-day trial, no card.</p>
            <Link className="btn" href="/register?plan=annual">
              Start trial
            </Link>
          </div>
          <div className="plan">
            <b className="name">Monthly</b>
            <span className="pnum">₪39</span>
            <span className="per">per month</span>
            <p>Same full access, no annual commitment.</p>
            <Link className="btn ghosted" href="/register?plan=monthly">
              Start monthly
            </Link>
          </div>
        </div>

        <section className="en-facts">
          <div>
            <b>Teams</b>
            <p>
              Seats from 5. VAT invoice, central seat management, role-based plan, monthly completion
              report. Quoted per organisation, not per click.
            </p>
          </div>
          <div>
            <b>Trial</b>
            <p>
              Seven days of full access without a card. No auto-charge when it ends — the labs simply
              close until you subscribe.
            </p>
          </div>
          <div>
            <b>Language</b>
            <p>
              Training content is Hebrew, because that is the language of the trade and of the safety
              procedure. This English shell exists for procurement.
            </p>
          </div>
        </section>

        <section className="employer">
          <div className="emp-in">
            <div>
              <h2>Buying for a team?</h2>
              <p>Request a quote and we reply within one business day.</p>
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
