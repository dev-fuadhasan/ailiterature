import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarCircles } from "@/components/ui/avatar-circles";
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
  ChevronRight,
  ArrowDown
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

      {/* Hero: Masterclass Centered Layout */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-24 overflow-hidden">
        {/* Sleek background decoration */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 inset-x-0 flex justify-center -z-10 pointer-events-none opacity-50">
          <div className="w-[1000px] h-[500px] bg-blue-400/20 blur-[140px] rounded-full mix-blend-multiply"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          <Badge variant="secondary" className="mb-6 text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 rounded-full px-4 py-1.5 shadow-sm transition-colors cursor-default backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2" /> Elevate your research
          </Badge>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-[1.1]">
            AI-powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">literature reviews.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
            ResearchRoom AI automates your literature review process. Enter your research topic to instantly find, download, and extract key insights from millions of academic research papers into a structured, exportable table.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
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

          {/* Trust indicators: Avatar circles */}
          <div className="flex flex-col items-center justify-center gap-3">
             <AvatarCircles 
               numPeople={999}
               avatarUrls={[
                 "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop&crop=faces&auto=format&q=80",
                 "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&auto=format&q=80",
                 "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces&auto=format&q=80",
                 "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces&auto=format&q=80"
               ]}
               className="transform scale-110"
             />
             <p className="text-sm font-medium text-gray-600">
               Trusted by <span className="font-semibold text-gray-900">1,000+ researchers</span> globally
             </p>
          </div>
        </div>

        {/* Product Screenshots - Centered Stack for max readability and zero overlap */}
        <div className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="flex flex-col relative z-10 items-center w-full">
            
            {/* Primary Dashboard Image */}
            <div className="w-full rounded-2xl md:rounded-[2rem] border border-gray-200/60 bg-white/40 backdrop-blur-lg shadow-2xl overflow-hidden ring-1 ring-gray-900/5 transform transition-all duration-700 hover:-translate-y-2 hover:shadow-3xl">
              <div className="flex items-center gap-1.5 md:gap-2 px-4 py-3 border-b border-gray-100/60 bg-white/80 backdrop-blur-md">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500/20 shadow-sm"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/20 shadow-sm"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500/20 shadow-sm"></div>
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

            {/* Connecting Visual - Professional flow between the images */}
            <div className="hidden md:flex flex-col items-center justify-center -mt-3 -mb-3 z-20">
              <div className="w-1 h-14 bg-gradient-to-b from-blue-200 to-blue-500 shadow-sm"></div>
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-4 border-white relative">
                 <ArrowDown className="w-5 h-5"/>
              </div>
              <div className="w-1 h-14 bg-gradient-to-b from-blue-500 to-indigo-200 shadow-sm"></div>
            </div>

            {/* Secondary Analysis Image - Mobile margin top, Desktop connected by line */}
            <div className="w-full md:w-[85%] mt-8 md:mt-0 rounded-2xl md:rounded-[2rem] border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] overflow-hidden ring-1 ring-gray-900/10 transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 bg-gray-50/80">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shadow-sm"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shadow-sm"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shadow-sm"></div>
                </div>
                <div className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-md shadow-sm border border-gray-100 uppercase tracking-wider">
                  Deep Analysis Engine
                </div>
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
