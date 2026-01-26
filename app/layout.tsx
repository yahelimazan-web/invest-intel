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
    <html lang="he" dir="rtl" className="dark" style={{ backgroundColor: '#0B0E14' }}>
      <body
        className={`${inter.variable} ${rubik.variable} antialiased`}
        style={{ 
          backgroundColor: '#0B0E14', 
          color: '#E8EAED',
          minHeight: '100vh',
          fontFamily: 'Inter, var(--font-inter), var(--font-rubik), system-ui, sans-serif'
        }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
