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
  metadataBase: new URL("https://researchroomai.vercel.app"),
  title: {
    default: "ResearchRoom AI - Automated Literature Review Generator",
    template: "%s | ResearchRoom AI"
  },
  description: "Automate your literature review with AI-powered research assistant. ResearchRoom quickly searches millions of academic papers, reads full texts, and extracts key findings, methodology, and limitations for your research paper.",
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
  authors: [{ name: "ResearchRoom AI" }],
  creator: "ResearchRoom AI",
  publisher: "ResearchRoom AI",
  applicationName: "ResearchRoom AI",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://researchroomai.vercel.app",
    title: "ResearchRoom AI - Automated Literature Review Generator",
    description: "Automate your literature review in minutes. Our AI searches, reads, and synthesizes academic papers into structured tables for your research.",
    siteName: "ResearchRoom AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchRoom AI - Automate Your Literature Review",
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
    canonical: "https://researchroomai.vercel.app",
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
    "name": "ResearchRoom AI",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Automate your literature review with AI-powered research assistant. ResearchRoom quickly searches millions of academic papers, reads full texts, and extracts key findings.",
    "operatingSystem": "Any",
    "url": "https://researchroomai.vercel.app",
    "author": {
      "@type": "Organization",
      "name": "ResearchRoom AI"
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
