"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Search, BookOpen, Calendar, Hash, AlertCircle, CheckCircle } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    topic: "",
    yearFrom: String(currentYear - 5),
    yearTo: String(currentYear),
    maxPapers: "20",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          topic: form.topic.trim(),
          yearFrom: parseInt(form.yearFrom),
          yearTo: parseInt(form.yearTo),
          maxPapers: parseInt(form.maxPapers),
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Failed to create project" }));
        throw new Error(data.error || "Failed to create project");
      }

      const { projectId } = await res.json();
      if (!projectId) throw new Error("Project was created but no project ID was returned");
      router.push(`/project/${projectId}`);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Starting review took too long. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Literature Review</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Set your topic and we&apos;ll find, download &amp; analyze relevant papers automatically.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-blue-600" />
            <label htmlFor="topic" className="text-sm font-semibold text-gray-800">
              Research Topic <span className="text-red-500">*</span>
            </label>
          </div>
          <Input
            id="topic"
            placeholder="e.g. deep learning for medical image segmentation"
            value={form.topic}
            onChange={(e) => handleChange("topic", e.target.value)}
            required
            className="h-11 text-sm text-gray-900 placeholder:text-gray-400 border-gray-300 focus-visible:ring-blue-500"
          />
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            Be specific — &ldquo;deep learning for retinal disease detection&rdquo; works much better than &ldquo;AI in medicine&rdquo;
          </p>
        </div>

        {/* Year Range */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Publication Year Range</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">From</label>
              <Select value={form.yearFrom} onValueChange={(v) => handleChange("yearFrom", v)}>
                <SelectTrigger className="h-11 text-gray-900 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-gray-900">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">To</label>
              <Select value={form.yearTo} onValueChange={(v) => handleChange("yearTo", v)}>
                <SelectTrigger className="h-11 text-gray-900 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-gray-900">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Narrower ranges return more focused, recent results.
          </p>
        </div>

        {/* Max papers */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Number of Papers to Analyze</span>
          </div>
          <Select value={form.maxPapers} onValueChange={(v) => handleChange("maxPapers", v)}>
            <SelectTrigger className="h-11 text-gray-900 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { value: "20",  label: "20 papers",  time: "~10 min" },
                { value: "30",  label: "30 papers",  time: "~15 min" },
                { value: "50",  label: "50 papers",  time: "~25 min" },
                { value: "60",  label: "60 papers",  time: "~30 min" },
                { value: "80",  label: "80 papers",  time: "~40 min" },
                { value: "100", label: "100 papers", time: "~40+ min" },
              ].map(({ value, label, time }) => (
                <SelectItem key={value} value={value} className="text-gray-900">
                  <span className="font-medium">{label}</span>
                  <span className="ml-2 text-gray-400 text-xs">{time}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Only open-access papers with full text are deeply analyzed. Others get abstract-only analysis.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full gap-2 h-12 text-base font-semibold cursor-pointer" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" /> Starting Review...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Start Literature Review
            </>
          )}
        </Button>
      </form>

      {/* Info strip */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { stat: "250M+", label: "Papers searched" },
          { stat: "37M+", label: "Free PDFs available" },
          { stat: "~10 min", label: "Avg. review time" },
        ].map((item, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-gray-200 text-center">
            <div className="text-xl font-bold text-blue-600 mb-0.5">{item.stat}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


