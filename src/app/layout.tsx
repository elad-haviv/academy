import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, IBM_Plex_Sans_Hebrew, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-display',
  display: 'swap',
});

const ui = IBM_Plex_Sans_Hebrew({
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
    default: 'Haviv Academy',
    template: '%s · Haviv Academy',
  },
  description:
    'מעבדות אינטראקטיביות לחשמל ולתעשייה: מפעילים, שוברים, ומאבחנים — במקום לצפות.',
  metadataBase: new URL('https://academy.haviv.pro'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${display.variable} ${ui.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
