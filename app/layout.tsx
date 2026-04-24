import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'SmartPRS — Intelligent Placement Readiness System',
  description: 'AI-powered, real-time placement tracking & prediction platform for engineering colleges. Turn every student into a placement success story.',
  keywords: 'placement readiness, AI, engineering colleges, student tracking, placement prediction, PRS score',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#E5E7EB',
              border: '1px solid #1F2937',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#06B6D4',
                secondary: '#111827',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
