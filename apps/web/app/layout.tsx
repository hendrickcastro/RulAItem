import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'RulAItem - Análisis Inteligente de Código',
  description: 'Sistema inteligente de análisis y documentación de código con IA',
  keywords: ['código', 'análisis', 'IA', 'documentación', 'git', 'desarrollo'],
  authors: [{ name: 'RulAItem Team' }],
  creator: 'RulAItem',
  publisher: 'RulAItem',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'RulAItem',
    description: 'Sistema inteligente de análisis y documentación de código con IA',
    url: '/',
    siteName: 'RulAItem',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RulAItem',
    description: 'Sistema inteligente de análisis y documentación de código con IA',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}