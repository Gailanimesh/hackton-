import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ToastProvider } from '@/components/ToastNotification';

export const metadata: Metadata = {
  title: 'VENDEX - AI Procurement Automation',
  description: 'Transform any complex mission into actionable projects & tasks in seconds.',
  icons: {
    icon: [
      { url: '/vendex_logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/vendex_logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/vendex_logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/vendex_logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="cursor-glow" />
        <div className="ambient-glow-bg" />
        <ToastProvider>
          {children}
        </ToastProvider>
        {/* Cursor glow mouse tracking */}
        <script dangerouslySetInnerHTML={{
          __html: `
          var glow = document.getElementById('cursor-glow');
          if (glow) {
            document.addEventListener('mousemove', function(e) {
              glow.style.left = e.clientX + 'px';
              glow.style.top = e.clientY + 'px';
            });
          }
        `}} />
      </body>
    </html>
  );
}
