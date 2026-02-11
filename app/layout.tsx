import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" dir="ltr" className={inter.variable} suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen text-slate-900`}
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
