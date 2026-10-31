import Image from 'next/image';
import Link from 'next/link';
import { isPublishable, type Lab } from '@/lib/labs';

export function LabCard({ lab }: { lab: Lab }) {
  const published = lab.status === 'published' && isPublishable(lab);

  return (
    <article className="lab-card">
      <div className="lab-cover">
        <Image src={lab.cover} alt={lab.title} width={760} height={506} />
      </div>
      <div className="lab-body">
        <div className="lab-top">
          <span className="tag">{lab.vertical === 'gensets' ? 'גנרטורים' : 'תאורת מסלולים'}</span>
          <span className={published ? 'chip chip-ok' : 'chip chip-soon'}>
            {published ? 'פעילה' : 'בפיתוח'}
          </span>
        </div>
        <h3>{lab.title}</h3>
        <p className="sub">{lab.subtitle}</p>
        <ul className="mini">
          {lab.outcomes.slice(0, 3).map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <div className="lab-foot">
          <span className="owner">
            מאמת: {lab.correctnessOwner ?? 'טרם נקבע'}
          </span>
          <Link className={published ? 'btn sm' : 'btn sm ghosted'} href={`/labs/${lab.slug}`}>
            {published ? 'כניסה' : 'רשימת המתנה'}
          </Link>
        </div>
      </div>
    </article>
  );
}
