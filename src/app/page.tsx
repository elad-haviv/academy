import Link from 'next/link';
import { Hero } from '@/components/Hero';
import { LabCard } from '@/components/LabCard';
import { SiteHeader } from '@/components/SiteHeader';
import { Shelf, Steps } from '@/components/Shelf';
import { EmployerBand, Pricing, SiteFooter } from '@/components/Sections';
import { loadLabs } from '@/lib/labs';
import { countRows, listCourses } from '@/lib/courses';

export const dynamic = 'force-dynamic';

export default function Home() {
  const labs = loadLabs();
  const labSlugs = new Set(labs.map((l) => l.slug));
  const courses = listCourses().filter((c) => !labSlugs.has(c.slug));
  const totals = {
    labs: labs.length,
    lessons: countRows('lessons'),
    tutorials: countRows('tutorials'),
  };

  return (
    <>
      <SiteHeader current="labs" />
      <main>
        <Hero totals={totals} />

        <section className="wrap labs">
          <div className="sec-head">
            <h2>המעבדות</h2>
            <Link className="sec-link" href="/labs">
              כל המעבדות ›
            </Link>
          </div>
          <div className="lab-grid">
            {labs.map((lab) => (
              <LabCard key={lab.slug} lab={lab} />
            ))}
          </div>
        </section>

        <Steps />
        <Shelf courses={courses} />
        <Pricing />
        <EmployerBand />
      </main>
      <SiteFooter />
    </>
  );
}
