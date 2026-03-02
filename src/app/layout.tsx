import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://researchroomai.com"),
  title: {
    default: "Research Room AI - Automated Literature Review Generator",
    template: "%s | Research Room AI"
  },
  description: "Automate your literature review with AI-powered research assistant. Research Room quickly searches millions of academic papers, reads full texts, and extracts key findings, methodology, and limitations for your research paper.",
  keywords: [
    "literature review AI",
    "research paper assistant",
    "AI literature review generator",
    "academic research tool",
    "automated literature review",
    "AI for researchers",
    "systematic review AI",
    "research automation",
    "academic paper analysis",
    "scholarly article search"
  ],
  authors: [{ name: "Research Room AI" }],
  creator: "Research Room AI",
  publisher: "Research Room AI",
  applicationName: "Research Room AI",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://researchroomai.com",
    title: "Research Room AI - Automated Literature Review Generator",
    description: "Automate your literature review in minutes. Our AI searches, reads, and synthesizes academic papers into structured tables for your research.",
    siteName: "Research Room AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Research Room AI - Automate Your Literature Review",
    description: "AI-powered research assistant that finds, reads, and summarizes academic papers for your literature review instantly.",
    creator: "@researchroomai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://researchroomai.com",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Research Room AI",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Automate your literature review with AI-powered research assistant. Research Room quickly searches millions of academic papers, reads full texts, and extracts key findings.",
    "operatingSystem": "Any",
    "url": "https://researchroomai.com",
    "author": {
      "@type": "Organization",
      "name": "Research Room AI"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "127"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
