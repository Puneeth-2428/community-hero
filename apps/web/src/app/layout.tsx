import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Community Hero',
  description: 'Empowering communities through collective action',
};

import { Toaster } from 'sonner';
import { SocketProvider } from '@/providers/SocketProvider';
import { GlobalSocketListeners } from '@/components/GlobalSocketListeners';
import { Header } from '@/components/Header';
import { NextAuthProvider } from '@/providers/NextAuthProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 dark:bg-background min-h-screen flex flex-col`}>
        <NextAuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <SocketProvider userId="citizen-1" ward="Downtown">
              <GlobalSocketListeners />
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Toaster position="bottom-right" />
            </SocketProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
