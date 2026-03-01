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
    default: "ResearchRoom AI | AI-Powered Literature Review Generator",
    template: "%s | ResearchRoom AI"
  },
  description: "Automate your literature review with AI. ResearchRoom AI quickly searches millions of academic papers, reads full texts, and extracts key findings, methodology, and limitations for your research paper.",
  keywords: ["literature review AI", "research paper assistant", "AI literature review generator", "academic research tool", "automated literature review", "AI for researchers", "systematic review AI"],
  authors: [{ name: "ResearchRoom AI" }],
  creator: "ResearchRoom AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://researchroomai.vercel.app",
    title: "ResearchRoom AI | AI-Powered Literature Review Generator",
    description: "Automate your literature review in minutes. AI searches, reads, and synthesizes academic papers into structured tables.",
    siteName: "ResearchRoom AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchRoom AI | Automate Your Literature Review",
    description: "AI-powered tool that finds, reads, and summarizes academic papers for your literature review instantly.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
