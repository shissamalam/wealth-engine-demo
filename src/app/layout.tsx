import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Henderson Family Wealth Architecture — Demo',
  description: 'Wealth management dashboard demo with fictional data',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-navy-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
