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
    siteName: 'Haviv Academy',
    images: [{ url: '/brand/ha-og-default.png', width: 1200, height: 630, alt: 'Haviv Academy — אקדמיית חביב' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haviv Academy',
    description: 'קורסים, מדריכים ומעבדות אינטראקטיביות בעברית.',
    images: ['/brand/ha-og-default.png'],
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/brand/ha-favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/ha-favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/ha-favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/brand/ha-apple-touch-180.png', sizes: '180x180' }],
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
