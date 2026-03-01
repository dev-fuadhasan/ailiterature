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
  title: "LiteratureAI — Automated Literature Review",
  description:
    "AI-powered academic literature review. Search thousands of papers, get structured insights instantly.",
  openGraph: {
    title: "LiteratureAI",
    description: "AI-powered academic literature review platform",
    url: "https://literatureai.vercel.app",
    siteName: "LiteratureAI",
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
