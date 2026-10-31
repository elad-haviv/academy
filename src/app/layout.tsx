import type { Metadata } from 'next';
import { Noto_Sans_Hebrew, Heebo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

/* Sans only — decided 2026-10-31. Noto Sans Hebrew carries the display voice,
   Heebo the body, Plex Mono the technical labels and numerals. */

const display = Noto_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Haviv Academy — למידה אינטראקטיבית לחשמל ולתעשייה',
    template: '%s · Haviv Academy',
  },
  description:
    'למידה אינטראקטיבית לחשמל ולתעשייה: שיעורים קצרים ואז מעבדה שמגיבה לכל פעולה. תאורת מסלולים וגנרטורים, בעברית, מהטלפון.',
  metadataBase: new URL('https://academy.haviv.pro'),
  alternates: { canonical: '/', languages: { he: '/', en: '/en' } },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: 'Haviv Academy',
    url: 'https://academy.haviv.pro',
    images: [{ url: '/img/og.png', width: 1200, height: 630, alt: 'Haviv Academy — למידה אינטראקטיבית לחשמל ולתעשייה' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haviv Academy',
    description: 'שיעורים קצרים ומעבדות אינטראקטיביות לתאורת מסלולים ולגנרטורים.',
    images: ['/img/og.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.svg' },
};

const ORG_LD = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Haviv Academy',
  alternateName: 'האביב אקדמי',
  url: 'https://academy.haviv.pro',
  logo: 'https://academy.haviv.pro/img/og.png',
  description:
    'פלטפורמת למידה אינטראקטיבית לחשמל ולתעשייה: שיעורים קצרים ומעבדות סימולציה בעברית, עם אימות תוכן.',
  areaServed: 'IL',
  knowsLanguage: ['he', 'en'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_LD) }} />
        {children}
      </body>
    </html>
  );
}
