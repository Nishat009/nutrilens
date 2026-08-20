import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriLens — Precision AI Food Scanner & Nutrition Intelligence',
  description:
    'NutriLens gives you instant nutritional breakdown of your meals with AI computer vision, personalized macro targets, and clinical-grade health tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
