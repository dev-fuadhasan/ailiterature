"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Search, BookOpen, Calendar, Hash } from "lucide-react";

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
    maxPapers: "100",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: form.topic.trim(),
          yearFrom: parseInt(form.yearFrom),
          yearTo: parseInt(form.yearTo),
          maxPapers: parseInt(form.maxPapers),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const { projectId } = await res.json();
      router.push(`/project/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Literature Review</h1>
        <p className="text-gray-500 mt-1">
          Enter your research topic and we&apos;ll automatically find, download, and analyze relevant papers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Research Parameters
          </CardTitle>
          <CardDescription>
            Configure what papers to search for. We&apos;ll search Semantic Scholar, OpenAlex, and arXiv.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Research Topic
              </Label>
              <Input
                id="topic"
                placeholder="e.g. machine learning in healthcare diagnostics"
                value={form.topic}
                onChange={(e) => handleChange("topic", e.target.value)}
                required
                className="text-base"
              />
              <p className="text-xs text-gray-400">
                Be specific — e.g. &quot;deep learning for medical image segmentation&quot; works better than &quot;AI in medicine&quot;
              </p>
            </div>

            {/* Year Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Publication Year Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">From</p>
                  <Select value={form.yearFrom} onValueChange={(v) => handleChange("yearFrom", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">To</p>
                  <Select value={form.yearTo} onValueChange={(v) => handleChange("yearTo", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Max papers */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" /> Maximum Papers to Analyze
              </Label>
              <Select value={form.maxPapers} onValueChange={(v) => handleChange("maxPapers", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 papers (fastest, ~3 min)</SelectItem>
                  <SelectItem value="50">50 papers (~5 min)</SelectItem>
                  <SelectItem value="100">100 papers (~10 min)</SelectItem>
                  <SelectItem value="200">200 papers (~20 min)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">
                Only open-access papers with full text will be deeply analyzed. Others get abstract-only analysis.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
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
        </CardContent>
      </Card>

      {/* Info panel */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        {infoItems.map((item, i) => (
          <div key={i} className="p-4 bg-white rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-blue-600 mb-1">{item.stat}</div>
            <div className="text-xs text-gray-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const infoItems = [
  { stat: "250M+", label: "Papers searched" },
  { stat: "37M+", label: "Free PDFs available" },
  { stat: "~10min", label: "Average review time" },
];
