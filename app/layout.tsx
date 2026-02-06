import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "InvestIntel | Real Estate Intelligence Platform",
  description: "Professional real estate investment intelligence and portfolio management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={inter.variable}>
      <body
        className={`${inter.variable} ${rubik.variable} font-sans antialiased min-h-screen text-slate-900`}
        style={{ fontFamily: 'var(--font-inter), Inter, var(--font-rubik), system-ui, sans-serif' }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
