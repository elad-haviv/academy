import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { currentUser } from '@/lib/auth';

export const metadata: Metadata = {
  metadataBase: new URL('https://academy.haviv.pro'),
  title: {
    default: 'Haviv Academy — קורסים, מדריכים ומעבדות אינטראקטיביות',
    template: '%s · Haviv Academy',
  },
  description:
    'אקדמיית חביב: קורסים ומדריכים בעברית בהנדסה, חשמל ותוכנה, לצד מעבדות לימוד אינטראקטיביות. הדור הבא של TutsZone.',
  openGraph: {
    title: 'Haviv Academy',
    description: 'קורסים, מדריכים ומעבדות אינטראקטיביות בעברית.',
    type: 'website',
    locale: 'he_IL',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const user = currentUser();
  return (
    <html lang="he" dir="rtl">
      <body>
        <SiteHeader user={user ? { name: user.name } : null} />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
