import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Download,
  Brain,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">LiteratureAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-50 border-blue-200">
          <Zap className="h-3 w-3 mr-1" /> Powered by Groq AI
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Literature Reviews in{" "}
          <span className="text-blue-600">Minutes, Not Weeks</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10">
          Enter your research topic. LiteratureAI searches 250M+ papers, finds free
          full-text PDFs, reads them with AI, and delivers a structured review table
          — ready to export as CSV.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="gap-2 text-base px-8">
              Start Your Review <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-2xl mx-auto">
            From research topic to full literature review in 4 automated steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Accelerate Your Research?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join researchers who use LiteratureAI to save weeks of manual work.
          </p>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-blue-600 border-white hover:bg-white text-base px-10">
              Get Started — It&apos;s Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
          <span>© 2026 LiteratureAI. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Searches 250M+ papers worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const steps = [
  {
    icon: Search,
    title: "Search by Topic",
    description: "Enter your research topic and set year range. We search Semantic Scholar, OpenAlex, and arXiv simultaneously.",
  },
  {
    icon: Download,
    title: "Auto-Download PDFs",
    description: "We find legal open-access PDFs via Unpaywall, CORE, and direct OA links, then securely store them.",
  },
  {
    icon: Brain,
    title: "AI Reads Papers",
    description: "Groq AI reads each paper and extracts: methodology, findings, limitations, future work, and more.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export Your Review",
    description: "View structured results in an interactive table and export as CSV — ready for your manuscript.",
  },
];

const features = [
  {
    icon: Globe,
    title: "250M+ Papers",
    description: "Searches across Semantic Scholar, OpenAlex, arXiv, PubMed and more in seconds.",
  },
  {
    icon: CheckCircle,
    title: "Legal PDF Access",
    description: "Only downloads open-access PDFs. Uses Unpaywall and CORE to find free, legal full text.",
  },
  {
    icon: Brain,
    title: "AI extraction",
    description: "Extracts methodology, findings, limitations, future work from every paper automatically.",
  },
  {
    icon: FileSpreadsheet,
    title: "CSV Export",
    description: "Download your full literature review as a CSV. Compatible with Excel, Google Sheets, and reference managers.",
  },
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Groq's ultra-fast inference processes papers in seconds, not minutes.",
  },
  {
    icon: BookOpen,
    title: "Structured Review",
    description: "All papers in a sortable, filterable table. Filter by year, study type, or open access status.",
  },
];
