"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PlanStatus } from "@/components/plan-status";
import {
  PlusCircle, FileText, Clock, CheckCircle, XCircle,
  Loader, Trash2, Search, HardDriveDownload, Brain,
  BookOpen, OctagonX, ArrowRight,
} from "lucide-react";

const statusConfig = {
  PENDING:    { label: "Queued",      color: "bg-gray-100 text-gray-600",    dot: "bg-gray-400",    icon: Clock },
  SEARCHING:  { label: "Searching",   color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",   icon: Search },
  DOWNLOADING:{ label: "Downloading", color: "bg-indigo-100 text-indigo-700",dot: "bg-indigo-500", icon: HardDriveDownload },
  ANALYZING:  { label: "Analyzing",   color: "bg-violet-100 text-violet-700",dot: "bg-violet-500", icon: Brain },
  COMPLETED:  { label: "Completed",   color: "bg-green-100 text-green-700",  dot: "bg-green-500",  icon: CheckCircle },
  FAILED:     { label: "Failed",      color: "bg-red-100 text-red-700",      dot: "bg-red-500",    icon: XCircle },
  STOPPED:    { label: "Stopped",     color: "bg-orange-100 text-orange-700",dot: "bg-orange-400", icon: OctagonX },
};

type ProjectItem = {
  id: string;
  topic: string;
  status: keyof typeof statusConfig;
  yearFrom: number;
  yearTo: number;
  maxPapers: number;
  totalPapers: number;
  processedPapers: number;
  createdAt: string;
};

type UserProfile = {
  planType: "FREE" | "PREMIUM";
  subscriptionStatus: "ACTIVE" | "TRIALING" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
  literatureReviewCount: number;
  trialStartDate: string;
  trialEndDate?: string | null;
  subscriptionEndDate?: string | null;
  planPeriod?: "MONTHLY" | "YEARLY" | null;
};

function DashboardContent() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const searchParams = useSearchParams();

  // Handle payment redirect messages
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setPaymentMessage({
        type: "success",
        text: "🎉 Payment successful! Your Premium plan is now active.",
      });
      // Clear the URL parameter
      window.history.replaceState({}, "", "/dashboard");
    } else if (payment === "cancelled") {
      setPaymentMessage({
        type: "error",
        text: "Payment was cancelled. You can try again from the pricing page.",
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) setProfile(await res.json());
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }

  useEffect(() => { 
    fetchProjects();
    fetchProfile();
  }, []);

  async function handleDelete(e: React.MouseEvent, projectId: string, topic: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${topic}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== projectId));
      else alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const active  = projects.filter((p) => !["COMPLETED", "FAILED", "STOPPED"].includes(p.status));
  const done    = projects.filter((p) => p.status === "COMPLETED");
  const stopped = projects.filter((p) => p.status === "STOPPED");
  const failed  = projects.filter((p) => p.status === "FAILED");

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Literature Reviews</h1>
          <p className="text-gray-500 mt-1">
            {projects.length === 0
              ? "No reviews yet — start your first one below."
              : `${projects.length} review${projects.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link href="/project/new">
          <Button className="gap-2 cursor-pointer">
            <PlusCircle className="h-4 w-4" /> New Review
          </Button>
        </Link>
      </div>

      {/* Payment Success/Cancel Message */}
      {paymentMessage && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            paymentMessage.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-yellow-50 border-yellow-200 text-yellow-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">{paymentMessage.text}</p>
            <button
              onClick={() => setPaymentMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Plan Status */}
      {profile && (
        <div className="mb-8">
          <PlanStatus
            planType={profile.planType}
            subscriptionStatus={profile.subscriptionStatus}
            literatureReviewCount={profile.literatureReviewCount}
            trialStartDate={profile.trialStartDate}
            trialEndDate={profile.trialEndDate}
            subscriptionEndDate={profile.subscriptionEndDate}
            planPeriod={profile.planPeriod}
          />
        </div>
      )}

      {projects.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-6 text-sm text-center max-w-sm">
            Start your first literature review and we&apos;ll automatically find and analyze relevant papers.
          </p>
          <Link href="/project/new">
            <Button className="gap-2 cursor-pointer">
              <PlusCircle className="h-4 w-4" /> Create Your First Review
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <ProjectGrid title="In Progress" projects={active} deletingId={deletingId} onDelete={handleDelete} />
          <ProjectGrid title="Completed" projects={done} deletingId={deletingId} onDelete={handleDelete} />
          <ProjectGrid title="Stopped" projects={stopped} deletingId={deletingId} onDelete={handleDelete} />
          <ProjectGrid title="Failed" projects={failed} deletingId={deletingId} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function ProjectGrid({
  title, projects, deletingId, onDelete,
}: {
  title: string;
  projects: ProjectItem[];
  deletingId: string | null;
  onDelete: (e: React.MouseEvent, id: string, topic: string) => void;
}) {
  if (projects.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} deletingId={deletingId} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project, deletingId, onDelete,
}: {
  project: ProjectItem;
  deletingId: string | null;
  onDelete: (e: React.MouseEvent, id: string, topic: string) => void;
}) {
  const config = statusConfig[project.status] ?? statusConfig.PENDING;
  const StatusIcon = config.icon;
  const isActive = !["COMPLETED", "FAILED", "STOPPED"].includes(project.status);
  const progress = project.maxPapers > 0
    ? Math.min(100, Math.round((project.processedPapers / project.maxPapers) * 100))
    : 0;

  return (
    <Link href={`/project/${project.id}`} className="group block">
      <div className="relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Top accent bar by status */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${config.dot}`} />

        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mt-1 mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug flex-1">
            {project.topic}
          </h3>
          <button
            onClick={(e) => onDelete(e, project.id, project.topic)}
            disabled={deletingId === project.id}
            className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Delete review"
          >
            {deletingId === project.id ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Status badge */}
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.color}`}>
            {isActive ? (
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
            ) : (
              <StatusIcon className="h-3 w-3" />
            )}
            {config.label}
          </span>
        </div>

        {/* Progress bar — always shown */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{project.processedPapers} analyzed</span>
            <span>of {project.maxPapers} papers</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.status === "COMPLETED" ? "bg-green-400" :
                project.status === "FAILED"    ? "bg-red-400" :
                project.status === "STOPPED"   ? "bg-orange-400" :
                "bg-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Meta footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{project.yearFrom}–{project.yearTo}</span>
          <div className="flex items-center gap-1 text-blue-500 group-hover:gap-2 transition-all font-medium">
            Open <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        <p className="text-xs text-gray-300 mt-1">
          {new Date(project.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>
    </Link>
  );
}



