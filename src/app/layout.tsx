import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Literature Review SaaS",
  description: "Automate discovering, reading, and synthesizing research papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased`}>
        <SessionProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
