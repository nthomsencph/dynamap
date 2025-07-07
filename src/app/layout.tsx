import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@/css/globals.css';
import { TimelineProvider } from '@/app/contexts/TimelineContext';
import { PanelStackProvider } from '@/app/contexts/PanelStackContext';
import { BackgroundImage } from './components/ui/BackgroundImage';

import { QueryClientProvider } from '@/app/providers/QueryClientProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dynamap',
  description: 'Dynamic, interactive map application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider>
          <TimelineProvider>
            <PanelStackProvider>
              <BackgroundImage />
              {children}
            </PanelStackProvider>
          </TimelineProvider>
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
