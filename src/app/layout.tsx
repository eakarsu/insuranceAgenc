import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/providers/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import SessionProvider from '@/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'InsureFlow - Insurance Agency Platform',
  description: 'Professional insurance agency management platform with AI-powered features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} id="__next">
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
