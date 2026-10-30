import Link from 'next/link';
import { ANNUAL_PRICE, TRIAL_DAYS } from '@/lib/pricing';

/**
 * The paywall card (spec §5.3). Deliberately plain: real preview above it, one
 * concrete next step, no blurred text and no fake content.
 */
export function PaywallCard({
  outcome,
  next,
}: {
  outcome: 'premium' | 'verify' | 'auth';
  next?: string;
}) {
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <section className="paywall" aria-labelledby="paywall-title">
      <div className="paywall-head">
        <h2 id="paywall-title">המשך השיעור זמין למנויים</h2>
        <p>
          עד כאן קראתם בחינם. שאר השיעור, כל הקורסים, המעבדות וחומרי העבודה פתוחים במנוי אחד.
        </p>
      </div>

      <dl className="paywall-facts">
        <div>
          <dt>מנוי</dt>
          <dd>
            {ANNUAL_PRICE} לשנה · ₪39 לחודש
          </dd>
        </div>
        <div>
          <dt>ניסיון</dt>
          <dd>{TRIAL_DAYS} ימים חינם, בלי כרטיס אשראי</dd>
        </div>
        <div>
          <dt>ביטול</dt>
          <dd>בכל עת, מהחשבון</dd>
        </div>
      </dl>

      {outcome === 'verify' ? (
        <p className="paywall-note">
          כדי להתחיל ניסיון צריך לאמת את כתובת המייל.{' '}
          <Link href="/dashboard">לחשבון שלי</Link>
        </p>
      ) : null}

      {outcome === 'auth' ? (
        <p className="paywall-note">
          כבר יש חשבון?{' '}
          <Link href={loginHref}>התחברות</Link> כדי להמשיך מאותו מקום.
        </p>
      ) : null}

      <div className="paywall-actions">
        <Link href="/pricing" className="btn">
          התחלת ניסיון
        </Link>
        <Link href="/pricing#compare" className="paywall-link">
          מה כלול במנוי
        </Link>
      </div>
    </section>
  );
}
