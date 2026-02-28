import { SearchForm } from "@/components/SearchForm";
import { Sparkles, Library, FileText, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            Autonomous
          </span> Research Assistant
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
          Enter your topic and let our AI discover Q1-Q3 papers, read the full PDFs, extract key insights, and generate a comprehensive literature review.
        </p>
      </div>

      <div className="w-full mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <SearchForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl w-full text-center">
        <FeatureCard
          icon={<Library className="w-8 h-8 text-indigo-500" />}
          title="Curated Discovery"
          description="Automatically searches and filters top quartile (Q1/Q2/Q3) papers within your timeframe."
        />
        <FeatureCard
          icon={<Download className="w-8 h-8 text-blue-500" />}
          title="PDF Extraction"
          description="Downloads Open Access PDFs and extracts text seamlessly."
        />
        <FeatureCard
          icon={<Sparkles className="w-8 h-8 text-purple-500" />}
          title="AI Synthesis"
          description="Reads the abstracts and full text to extract Strengths, Future Work, and summaries."
        />
        <FeatureCard
          icon={<FileText className="w-8 h-8 text-emerald-500" />}
          title="Export Ready"
          description="Download your complete literature review in CSV format."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hidden md:flex">
      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}
