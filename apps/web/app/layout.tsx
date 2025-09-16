// Import Metadata type from Next.js to define metadata for SEO purposes.
import type { Metadata } from 'next';

// Import Google's Inter font with specific subsets and setup a CSS variable for it.
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers'; // Import custom providers component for context management.
import './globals.css'; // Import global styles.

// Setup the Inter font. Only load Latin subset, set up as a CSS variable for easy use throughout the app.
const inter = Inter({ 
  subsets: ['latin'], // Load only Latin character subset to optimize performance.
  variable: '--font-inter', // Use CSS variable for applying the font.
});

// Define global metadata for SEO purposes. This will be used by search engines and social media platforms.
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
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'), // Base URL for metadata, falling back to localhost if not in environment.
  
  openGraph: {
    title: 'RulAItem',
    description: 'Sistema inteligente de análisis y documentación de código con IA',
    url: '/',
    siteName: 'RulAItem',
    locale: 'es_ES', // Locale set to Spanish (Spain).
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
      'max-image-preview': 'large', // Allow large image previews for Google bots.
      'max-snippet': -1, // No limit on snippet length for Google bot's preview.
    },
  },
  
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION, // Verify site with Google using environment variable.
  },
};

// Export default function RootLayout that wraps the entire application.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // Children prop containing all nested components within this layout.
}) {
  return (
    <html lang="es" suppressHydrationWarning> {/* Set language to Spanish and suppress hydration warnings in Next.js. */}
      <body className={inter.className}> {/* Apply Inter font class name through CSS variable. */}
        <Providers> {/* Provide context for all child components within the layout. */}
          {children} {/* Render children passed into RootLayout, effectively making this component a wrapper for entire app content. */}
        </Providers>
      </body>
    </html>
  );
}