import type { Metadata } from "next";
import Script from "next/script";
import { Pixelify_Sans, Lilita_One } from "next/font/google";
import "./globals.css";

const pixelifySans = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lilitaOne = Lilita_One({
  variable: "--font-lilita",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "remember.fm — Rediscover the songs that shaped you",
  description:
    "Rediscover the forgotten songs, cultural moments, and memories from your formative years.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${pixelifySans.variable} ${lilitaOne.variable}`}>
      <body>
        {children}
        {/* Floating top-right (default fixed/top-right) — every screen here
            is a centered phone-frame div on a black backdrop, no shared
            header/nav bar to dock into. data-accent-color is the lime green
            from the remember.fm wordmark (page.tsx's logo span). */}
        <Script src="/shared/account-widget.js" data-accent-color="#c2f02e" strategy="afterInteractive" />
      </body>
    </html>
  );
}
