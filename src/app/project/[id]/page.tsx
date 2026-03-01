"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Download, RefreshCw, ExternalLink, BookOpen,
  ChevronDown, ChevronUp, FileText, AlertCircle,
  Microscope, Lightbulb, AlertTriangle, ArrowRight, Tag, StopCircle,
  Search, HardDriveDownload, Brain, CheckCircle2, OctagonX,
} from "lucide-react";

interface Extraction {
  methodology: string | null;
  findings: string | null;
  limitations: string | null;
  futureWork: string | null;
  studyType: string | null;
  keywords: string[];
  isAbstractOnly: boolean;
}

interface Paper {
  id: string;
  doi: string | null;
  title: string;
  authors: { name: string }[];
  year: number | null;
  journal: string | null;
  abstract: string | null;
  citationCount: number | null;
  isOpenAccess: boolean;
  quartile: string | null;
  extraction: Extraction | null;
  extractionStatus: string;
}

interface Project {
  id: string;
  topic: string;
  yearFrom: number;
  yearTo: number;
  maxPapers: number;
  status: string;
  totalPapers: number;
  processedPapers: number;
  failedPapers: number;
  errorMessage: string | null;
  papers: Paper[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Queued",
  SEARCHING: "Searching papers...",
  DOWNLOADING: "Downloading PDFs...",
  ANALYZING: "Analyzing with AI...",
  COMPLETED: "Completed",
  FAILED: "Failed",
  STOPPED: "Stopped by user",
};

// Step-by-step animated progress indicator shown while analysis is running
function LiveAnalysisProgress({
  status,
  totalFound,
  analyzed,
  maxPapers,
  stopping,
}: {
  status: string;
  totalFound: number;
  analyzed: number;
  maxPapers: number;
  stopping: boolean;
}) {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot((d) => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);
  const dots = ".".repeat(dot);

  if (stopping) {
    return (
      <div className="mt-3 flex items-center gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
        <OctagonX className="h-5 w-5 text-orange-500 shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-semibold text-orange-700">Stopping analysis{dots}</p>
          <p className="text-xs text-orange-500 mt-0.5">
            Wrapping up current paper and saving results — this may take a few seconds.
          </p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      key: "SEARCHING",
      icon: Search,
      label: "Searching databases",
      detail: "Scanning Semantic Scholar, OpenAlex & arXiv for relevant papers",
      active: status === "SEARCHING",
      done: ["DOWNLOADING", "ANALYZING", "COMPLETED"].includes(status),
    },
    {
      key: "DOWNLOADING",
      icon: HardDriveDownload,
      label: `Fetching PDFs (${totalFound} papers found)`,
      detail: "Locating open-access full-text PDFs via Unpaywall & CORE",
      active: status === "DOWNLOADING",
      done: ["ANALYZING", "COMPLETED"].includes(status),
    },
    {
      key: "ANALYZING",
      icon: Brain,
      label: `AI reading papers — ${analyzed} of ${maxPapers} complete`,
      detail: "Groq AI is extracting methodology, findings & limitations from each paper",
      active: status === "ANALYZING",
      done: status === "COMPLETED",
    },
  ];

  return (
    <div className="mt-3 space-y-2">
      {steps.map((step) => {
        const Icon = step.icon;
        return (
          <div
            key={step.key}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors ${
              step.active
                ? "bg-blue-50 border-blue-200"
                : step.done
                ? "bg-green-50 border-green-200 opacity-70"
                : "bg-gray-50 border-gray-200 opacity-40"
            }`}
          >
            <div className={`mt-0.5 shrink-0 ${step.active ? "text-blue-600" : step.done ? "text-green-600" : "text-gray-400"}`}>
              {step.done ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : step.active ? (
                <Icon className="h-4 w-4 animate-pulse" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.active ? "text-blue-800" : step.done ? "text-green-800" : "text-gray-500"}`}>
                {step.label}{step.active ? dots : ""}
              </p>
              {step.active && (
                <p className="text-xs text-blue-600 mt-0.5">{step.detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const QUARTILE_COLORS: Record<string, string> = {
  Q1: "bg-emerald-100 text-emerald-800",
  Q2: "bg-blue-100 text-blue-800",
  Q3: "bg-orange-100 text-orange-800",
  Q4: "bg-gray-100 text-gray-600",
};

function DetailPanel({ paper }: { paper: Paper }) {
  const e = paper.extraction;
  const analyzed = paper.extractionStatus === "COMPLETED" || paper.extractionStatus === "ABSTRACT_ONLY";
  const failed = paper.extractionStatus === "FAILED";

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-t border-blue-100 px-6 py-5">
      {/* Paper header */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {paper.quartile && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${QUARTILE_COLORS[paper.quartile] || "bg-gray-100 text-gray-600"}`}>
              {paper.quartile}
            </span>
          )}
          {paper.isOpenAccess && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              Open Access
            </span>
          )}
          {e?.studyType && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {e.studyType}
            </span>
          )}
          {e?.isAbstractOnly && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
              Abstract analysis
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          {paper.authors.length > 0 && (
            <span>{paper.authors.slice(0, 3).map((a) => a.name).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
          )}
          {paper.year && <span>· {paper.year}</span>}
          {paper.journal && <span>· <em>{paper.journal}</em></span>}
          {paper.citationCount != null && <span>· {paper.citationCount} citations</span>}
          {paper.doi && (
            <a
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> DOI
            </a>
          )}
        </div>
      </div>

      {failed && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Analysis failed</p>
            <p className="mt-0.5 text-xs">Could not download the full PDF and no abstract was available. This paper is still listed so you can access it manually via DOI.</p>
          </div>
        </div>
      )}

      {!analyzed && !failed && (
        <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-500">
          <Spinner size="sm" /> Analysis pending...
        </div>
      )}

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Abstract */}
          {paper.abstract && (
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Abstract
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{paper.abstract}</p>
            </div>
          )}

          {/* Methodology */}
          {e?.methodology && e.methodology !== "Not specified." && (
            <div className="bg-white rounded-xl border border-indigo-100 p-4">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Microscope className="h-3.5 w-3.5" /> Methodology
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.methodology}</p>
            </div>
          )}

          {/* Findings */}
          {e?.findings && e.findings !== "Not specified." && (
            <div className="bg-white rounded-xl border border-emerald-100 p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Lightbulb className="h-3.5 w-3.5" /> Key Findings
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.findings}</p>
            </div>
          )}

          {/* Limitations */}
          {e?.limitations && e.limitations !== "Not specified." && (
            <div className="bg-white rounded-xl border border-orange-100 p-4">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Limitations
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.limitations}</p>
            </div>
          )}

          {/* Future Work */}
          {e?.futureWork && e.futureWork !== "Not specified." && (
            <div className="bg-white rounded-xl border border-purple-100 p-4">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> Future Work
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{e.futureWork}</p>
            </div>
          )}

          {/* Keywords */}
          {e?.keywords && e.keywords.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {e.keywords.map((kw, k) => (
                  <span key={k} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [quartileFilter, setQuartileFilter] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) setProject(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useEffect(() => {
    if (!project) return;
    // Clear stopping indicator once the project actually reaches STOPPED/COMPLETED
    if (["STOPPED", "COMPLETED", "FAILED"].includes(project.status)) {
      setStopping(false);
    }
    if (["COMPLETED", "FAILED", "STOPPED"].includes(project.status)) return;
    const interval = setInterval(fetchProject, 4000);
    return () => clearInterval(interval);
  }, [project, fetchProject]);

  async function handleStop() {
    setStopping(true);
    try {
      await fetch(`/api/projects/${projectId}/stop`, { method: "POST" });
      // Keep polling; stopping flag will clear once status flips to STOPPED
      setTimeout(fetchProject, 1500);
    } catch { alert("Failed to send stop request."); setStopping(false); }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `literature-review-${projectId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed."); }
    finally { setExporting(false); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  if (!project) return <div className="p-8 text-center"><p className="text-gray-500">Project not found.</p></div>;

  const isTerminal = ["COMPLETED", "FAILED", "STOPPED"].includes(project.status);
  // Only treat as fully complete when the backend says COMPLETED AND we hit the target count
  const isActuallyComplete = project.status === "COMPLETED" && fullText >= project.maxPapers;
  const isProcessing = !isTerminal || (!isActuallyComplete && project.status === "COMPLETED");

  const totalFound = project.papers.length;
  const fullText = project.papers.filter((p) => p.extractionStatus === "COMPLETED").length;

  const progress = project.maxPapers > 0 ? Math.min(100, Math.round((fullText / project.maxPapers) * 100)) : 0;

  const QUARTILES = ["Q1", "Q2", "Q3", "Q4"];

  // Always show only fully-analyzed (COMPLETED) papers; quartile filter on top
  let displayPapers = project.papers.filter((p) => p.extractionStatus === "COMPLETED");
  if (quartileFilter) displayPapers = displayPapers.filter((p) => p.quartile === quartileFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{project.topic}</h1>
            <p className="text-sm text-gray-500">{project.yearFrom} – {project.yearTo} · up to {project.maxPapers} papers</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchProject} className="gap-1 cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            {isProcessing && (
              <Button
                size="sm"
                onClick={handleStop}
                disabled={stopping}
                className="gap-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {stopping ? <Spinner size="sm" /> : <StopCircle className="h-3.5 w-3.5" />}
                {stopping ? "Stopping..." : "Stop"}
              </Button>
            )}
            {isActuallyComplete && (
              <Button size="sm" onClick={handleExport} disabled={exporting} className="gap-1 cursor-pointer">
                {exporting ? <Spinner size="sm" /> : <Download className="h-3.5 w-3.5" />}
                Export CSV
              </Button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isProcessing && !stopping && <Spinner size="sm" />}
              <span className="text-sm font-medium text-gray-700">
                {stopping
                  ? "Stopping analysis..."
                  : isActuallyComplete
                  ? "✅ Analysis complete"
                  : STATUS_LABELS[project.status] || project.status}
              </span>
            </div>
            {project.maxPapers > 0 && (
              <span className="text-xs text-gray-400">{fullText} of {project.maxPapers} analyzed ({progress}%)</span>
            )}
          </div>
          {project.maxPapers > 0 && <Progress value={progress} className="h-2 mb-3" />}
          {/* Stats pills */}
          {totalFound > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 bg-gray-100 rounded-full text-gray-700 font-medium">{totalFound} found</span>
              <span className={`px-2.5 py-1 rounded-full font-medium ${isActuallyComplete ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                {isActuallyComplete ? "✓" : "⟳"} {fullText} of {project.maxPapers} analyzed
              </span>
            </div>
          )}

          {/* Live step-by-step progress while processing */}
          {(isProcessing || stopping) && (
            <LiveAnalysisProgress
              status={project.status}
              totalFound={totalFound}
              analyzed={fullText}
              maxPapers={project.maxPapers}
              stopping={stopping}
            />
          )}

          {project.status === "FAILED" && project.errorMessage && (
            <p className="text-sm text-red-600 mt-2">{project.errorMessage}</p>
          )}
          {project.status === "STOPPED" && (
            <p className="text-sm text-orange-600 mt-2">Review stopped early. Results above show papers analyzed so far.</p>
          )}
        </div>
      </div>

      {/* Papers */}
      {project.papers.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar — quartile filter only; papers are always filtered to COMPLETED (full PDF) */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-gray-700">{fullText} analyzed paper{fullText !== 1 ? 's' : ''}</span>
            <div className="w-px h-4 bg-gray-200" />
            {/* Quartile filter */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 mr-1">Quartile:</span>
              <button
                onClick={() => setQuartileFilter(null)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${!quartileFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >All</button>
              {QUARTILES.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuartileFilter(quartileFilter === q ? null : q)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${quartileFilter === q ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >{q}</button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-gray-500">Full PDF analyzed</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Authors</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Journal</th>
                  <th className="px-4 py-3 text-left">Cite</th>
                  <th className="px-4 py-3 text-left">Q</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {displayPapers.map((paper, idx) => {
                  const isExpanded = expandedRow === paper.id;
                  const dotColor =
                    paper.extractionStatus === "COMPLETED" ? "bg-green-400" :
                    paper.extractionStatus === "ABSTRACT_ONLY" ? "bg-yellow-400" :
                    paper.extractionStatus === "FAILED" ? "bg-red-300" : "bg-gray-300";

                  return (
                    <>
                      <tr
                        key={paper.id}
                        className={`border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-blue-50" : ""}`}
                        onClick={() => setExpandedRow(isExpanded ? null : paper.id)}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${dotColor}`} />
                            <p className="font-medium text-gray-900 line-clamp-2 max-w-sm leading-snug">
                              {paper.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[130px]">
                          <p className="truncate">
                            {paper.authors.length > 0
                              ? paper.authors.slice(0, 2).map((a) => a.name).join(", ") + (paper.authors.length > 2 ? " et al." : "")
                              : "–"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{paper.year ?? "–"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px]">
                          <p className="truncate">{paper.journal ?? "–"}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{paper.citationCount ?? "–"}</td>
                        <td className="px-4 py-3">
                          {paper.quartile ? (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${QUARTILE_COLORS[paper.quartile] || "bg-gray-100 text-gray-600"}`}>
                              {paper.quartile}
                            </span>
                          ) : "–"}
                        </td>
                        <td className="px-4 py-3">
                          {paper.extractionStatus === "COMPLETED" ? (
                            <Badge variant="success" className="text-xs">Full</Badge>
                          ) : paper.extractionStatus === "ABSTRACT_ONLY" ? (
                            <Badge variant="warning" className="text-xs">Abstract</Badge>
                          ) : paper.extractionStatus === "FAILED" ? (
                            <Badge variant="destructive" className="text-xs">Failed</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-blue-500" />
                            : <ChevronDown className="h-4 w-4 text-gray-300" />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${paper.id}-detail`}>
                          <td colSpan={9} className="p-0">
                            <DetailPanel paper={paper} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayPapers.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No papers match the selected filters.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{isProcessing ? "Searching for papers..." : "No papers found."}</p>
        </div>
      )}
    </div>
  );
}
