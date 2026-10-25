import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SITE_KEYWORDS, siteOrigin } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: "Bloghave", template: "%s · Bloghave" },
  description: "Write an article or FAQ once on Bloghave. The edited page, the writer, and both dates arrive intact on every linked desk.",
  keywords: SITE_KEYWORDS,
  applicationName: "Bloghave",
  authors: [{ name: "Fellohtech", url: "https://fellohtech.com" }],
  creator: "Fellohtech",
  publisher: "Bloghave",
  category: "publishing",
  openGraph: { type: "website", siteName: "Bloghave", locale: "en_GB" },
  twitter: { card: "summary" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
