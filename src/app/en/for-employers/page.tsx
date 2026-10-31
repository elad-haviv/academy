import Link from 'next/link';
import { SiteFooter } from '@/components/Sections';
import { waitlistAction } from '../../actions';

export const metadata = { title: 'For employers — Haviv Academy' };

const ROWS: [string, string][] = [
  ['Seats', 'From 5 seats, central management, add or remove any month'],
  ['Invoice', 'VAT invoice (חשבונית מס), net-30 terms for organisations'],
  ['Plan', 'Role-based tracks: field electrician, maintenance technician, shift lead'],
  ['Reporting', 'Per-employee progress and lab completions — CSV or monthly digest'],
  ['Onboarding', 'One hour with an instructor for the team, remote, first week'],
];

export default async function EnEmployers({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

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
            <Link href="/for-employers">עברית</Link>
          </nav>
        </div>
      </header>
      <main className="wrap page">
        <header className="page-head">
          <p className="eyebrow">
            <span className="pip" aria-hidden="true" />
            Organisations · contractors · colleges
          </p>
          <h1>Train the team, not one person</h1>
          <p className="lede">
            The same content with organisational access: seats, invoice, role-based plan and
            completion reporting. Reply within one business day.
          </p>
        </header>

        <div className="emp-grid">
          <div className="emp-table">
            {ROWS.map(([k, v]) => (
              <div className="emp-row" key={k}>
                <b>{k}</b>
                <span>{v}</span>
              </div>
            ))}
          </div>
          <div className="emp-form">
            {sent ? (
              <div className="form-ok">
                <b>Received.</b>
                <p>We will reply by email within one business day with a quote and seat count.</p>
                <Link className="ghost" href="/en/labs">
                  In the meantime — see the labs ›
                </Link>
              </div>
            ) : (
              <form action={waitlistAction} className="form">
                <input type="hidden" name="source" value="employers-en" />
                <input type="hidden" name="lang" value="en" />
                <h2>Request a quote</h2>
                {error === 'email' && <p className="form-error">That email does not look valid.</p>}
                <label>
                  Name
                  <input type="text" name="name" required placeholder="Full name" />
                </label>
                <label>
                  Work email
                  <input type="email" name="email" required placeholder="name@company.co.il" />
                </label>
                <label>
                  What you need
                  <textarea name="note" rows={4} placeholder="Headcount, roles, start date" />
                </label>
                <button className="btn lg" type="submit">
                  Send
                </button>
                <p className="form-note">No newsletter. Details are used for this quote only.</p>
              </form>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
