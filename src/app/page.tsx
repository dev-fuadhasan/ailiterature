import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
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
  LayoutDashboard,
  Sparkles,
  ChevronRight
} from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isSignedIn = !!user;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-blue-100 text-gray-900">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-xl tracking-tight">ResearchRoom <span className="text-blue-600">AI</span></span>
          </div>
          <div className="flex items-center gap-4">
            {/* Minimalist Top Nav - Primary CTA is now entirely deferred to the Hero section */}
             {!isSignedIn && (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Sleek background decoration */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 inset-x-0 flex justify-center -z-10 pointer-events-none opacity-50">
          <div className="w-[1000px] h-[500px] bg-blue-400/20 blur-[140px] rounded-full mix-blend-multiply"></div>
        </div>

        {/* Changed max-w-7xl to max-w-6xl to perfectly align the left margin with the Navbar Logo */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
            
            {/* Left Column: Copy & CTA */}
            <div className="flex-1 text-center lg:text-left pt-2 md:pt-4">
              <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 rounded-full px-4 py-1.5 shadow-sm transition-colors cursor-default backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 mr-2" /> Elevate your research
              </Badge>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
                AI-powered <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">literature reviews.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                ResearchRoom AI automates your literature review process. Enter your research topic to instantly find, download, and extract key insights from millions of academic research papers into a structured, exportable table.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {isSignedIn ? (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all gap-2">
                      Go to Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto rounded-full h-12 px-8 text-base shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all gap-2">
                        Start Your Review <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/#how-it-works" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-12 px-8 text-base border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-gray-300 transition-all">
                        See How It Works
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Dynamic Diagonal Stack (PRO UX) */}
            <div className="flex-[1.3] w-full relative mt-16 flex flex-col items-center lg:items-start group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-blue-500/10 blur-[130px] rounded-full pointer-events-none"></div>
              
              {/* This container bleeds off the right edge so the HD screenshots can remain physically massive and fully readable */}
              <div className="relative w-full lg:w-[130%] xl:w-[140%] flex flex-col gap-6 md:gap-8 z-10 lg:-mr-32 xl:-mr-48">
                
                {/* Main Image (Top & Left) - Content remains 100% visible */}
                <div className="relative rounded-xl md:rounded-2xl border border-gray-200/60 bg-white/40 backdrop-blur-lg shadow-2xl xl:shadow-3xl overflow-hidden transform transition-all duration-700 hover:-translate-y-2 ring-1 ring-gray-900/5">
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border-b border-gray-100/60 bg-white/80 backdrop-blur-md">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-400 border border-red-500/20"></div>
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-amber-400 border border-amber-500/20"></div>
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-400 border border-green-500/20"></div>
                  </div>
                  <Image 
                    src="/img1.png"
                    alt="Literature Review Dashboard"
                    width={1920}
                    height={1080}
                    quality={100}
                    className="w-full h-auto object-cover"
                    priority
                    unoptimized={true}
                  />
                </div>

                {/* Second Image - Placed below with a slight upwards shift. Overlaps ONLY the bottom frame of Image 1! */}
                <div className="relative w-[95%] md:w-[92%] self-end rounded-xl md:rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden z-20 transform transition-all duration-500 hover:-translate-y-2 ring-1 ring-gray-900/10 lg:-mt-16 xl:-mt-24">
                  <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 border-b border-gray-100/80 bg-gray-50/80">
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gray-300"></div>
                  </div>
                  <Image 
                    src="/img2.png"
                    alt="Literature Review Process Analysis"
                    width={1920}
                    height={1080}
                    quality={100}
                    className="w-full h-auto object-cover"
                    priority
                    unoptimized={true}
                  />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section id="how-it-works" className="py-24 bg-white/60 border-y border-gray-200/50 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl tracking-tight font-bold text-gray-900 mb-4">
              How our AI literature review generator works
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              From defining your research topic to downloading the final CSV, our platform handles the heavy lifting of academic research without surfacing complex AI settings.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300 group-hover:border-blue-200">
                  {<step.icon className="h-6 w-6 text-blue-600" />}
                </div>
                <div className="text-sm font-semibold text-blue-600 tracking-wider mb-2 flex items-center gap-2">
                  <span>Step 0{i + 1}</span>
                  {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 hidden md:block absolute -right-4 top-5" />}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2.5 text-lg">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl tracking-tight font-bold text-gray-900 mb-4">
            Built for rigorous academic literature reviews
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            A beautiful, sleek interface that hides the immense complexity of document parsing, research scoping, and systematic review analysis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                {<f.icon className="h-5 w-5 text-gray-700" />}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-gray-900 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none opacity-30">
            <div className="w-[600px] h-[300px] bg-blue-500 blur-[100px] rounded-full"></div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight relative z-10">
            Ready to accelerate your research?
          </h2>
          <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto relative z-10">
            Join researchers saving weeks of manual review time. Beautifully simple. Unbelievably smart.
          </p>
          <div className="relative z-10">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white border-0 h-12 px-8 text-base">
                  Go to your Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white border-0 h-12 px-10 text-base shadow-lg shadow-blue-900/50">
                  Join for Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-medium text-gray-800">
            <BookOpen className="h-4 w-4 text-blue-600" /> ResearchRoom AI
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <span>Searching 250M+ academic papers globally</span>
          </div>
          <span>&copy; {new Date().getFullYear()} ResearchRoom AI. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

const steps = [
  {
    icon: Search,
    title: "Define Your Topic",
    description: "Enter your subject and constraints. We instantly query massive academic repositories like Semantic Scholar and arXiv.",
  },
  {
    icon: Download,
    title: "Secure Full Texts",
    description: "Our pipeline automatically identifies and downloads legal open-access PDFs from hundreds of trusted databases.",
  },
  {
    icon: Brain,
    title: "AI Synthesis",
    description: "Our advanced models read each paper cover-to-cover, accurately extracting methodology, findings, and limitations.",
  },
  {
    icon: FileSpreadsheet,
    title: "Export & Analyze",
    description: "Review all synthesized findings in a unified dashboard or download them as a CSV for offline reference management.",
  },
];

const features = [
  {
    icon: Globe,
    title: "Comprehensive Search",
    description: "Access a library of over 250 million papers, aggregated from multiple major scientific databases simultaneously.",
  },
  {
    icon: CheckCircle,
    title: "Compliant Access",
    description: "Downloads are restricted to authorized open-access sources, ensuring your review is compliant and completely reliable.",
  },
  {
    icon: Brain,
    title: "Deep Context Extraction",
    description: "Beyond just reading abstracts, our system analyzes full document narratives to pull out complex study boundaries.",
  },
  {
    icon: FileSpreadsheet,
    title: "Structured Output",
    description: "Convert unstructured PDFs into neat, tabular formats perfectly suited for massive quantitative meta-analysis.",
  },
  {
    icon: Zap,
    title: "Rapid Execution",
    description: "What used to take months of manual reading is condensed into minutes of seamless background processing.",
  },
  {
    icon: BookOpen,
    title: "Intuitive Management",
    description: "A meticulously clean dashboard to visually sift through papers, apply filters, and track the progress of ongoing reviews.",
  },
];
