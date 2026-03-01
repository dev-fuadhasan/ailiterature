"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PlusCircle, FileText, Clock, CheckCircle, XCircle, Loader, Trash2 } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: Clock },
  SEARCHING: { label: "Searching", variant: "default" as const, icon: Loader },
  DOWNLOADING: { label: "Downloading", variant: "default" as const, icon: Loader },
  ANALYZING: { label: "Analyzing", variant: "default" as const, icon: Loader },
  COMPLETED: { label: "Completed", variant: "success" as const, icon: CheckCircle },
  FAILED: { label: "Failed", variant: "destructive" as const, icon: XCircle },
};

type ProjectItem = {
  id: string;
  topic: string;
  status: keyof typeof statusConfig;
  yearFrom: number;
  yearTo: number;
  totalPapers: number;
  processedPapers: number;
  createdAt: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleDelete(e: React.MouseEvent, projectId: string, topic: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${topic}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } else {
        alert("Failed to delete. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Literature Reviews</h1>
          <p className="text-gray-500 mt-1">Manage and track your research review projects</p>
        </div>
        <Link href="/project/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Review
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-6">Start your first literature review to see it here.</p>
          <Link href="/project/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Your First Review
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const config = statusConfig[project.status] ?? statusConfig.PENDING;
            const StatusIcon = config.icon;
            const progress =
              project.totalPapers > 0
                ? Math.round((project.processedPapers / project.totalPapers) * 100)
                : 0;
            return (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
                        {project.topic}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant={config.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <button
                          onClick={(e) => handleDelete(e, project.id, project.topic)}
                          disabled={deletingId === project.id}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete review"
                        >
                          {deletingId === project.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        {project.yearFrom} – {project.yearTo}
                      </p>
                      <p>
                        {project.processedPapers} / {project.totalPapers} papers analyzed
                        {project.totalPapers > 0 && ` (${progress}%)`}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(project.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
