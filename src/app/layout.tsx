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
    default: 'Haviv Academy — מעבדות לחשמל ולתעשייה',
    template: '%s · Haviv Academy',
  },
  description:
    'מעבדות אינטראקטיביות לחשמל ולתעשייה: תאורת מסלולים וגנרטורים. מפעילים, שוברים ומאבחנים — עם מדידות אמיתיות והשלכות.',
  metadataBase: new URL('https://academy.haviv.pro'),
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: 'Haviv Academy',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
