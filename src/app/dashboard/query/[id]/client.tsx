"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";

export function QueryDashboardClient({ initialQuery }: { initialQuery: any }) {
    const [query, setQuery] = useState(initialQuery);
    const [isProcessing, setIsProcessing] = useState(initialQuery.status === "PENDING" || initialQuery.status === "PROCESSING");

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isProcessing) {
            if (query.status === "PENDING") {
                // Trigger processing
                fetch(`/api/process/${query.id}`, { method: "POST" });
            }

            // Poll for updates
            interval = setInterval(async () => {
                const res = await fetch(`/api/query/${query.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setQuery(data);
                    if (data.status === "COMPLETED" || data.status === "FAILED") {
                        setIsProcessing(false);
                    }
                }
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isProcessing, query.id, query.status]);

    const exportCSV = () => {
        const headers = ["Title", "Authors", "DOI", "URL", "Abstract", "Strengths", "Future Work", "AI Summary"];
        const rows = query.papers.map((p: any) => [
            `"${p.title?.replace(/"/g, '""') || ''}"`,
            `"${p.authors?.replace(/"/g, '""') || ''}"`,
            `"${p.doi || ''}"`,
            `"${p.url || ''}"`,
            `"${p.abstract?.replace(/"/g, '""') || ''}"`,
            `"${p.literatureReview?.strengths?.replace(/"/g, '""') || ''}"`,
            `"${p.literatureReview?.futureWork?.replace(/"/g, '""') || ''}"`,
            `"${p.literatureReview?.aiSummary?.replace(/"/g, '""') || ''}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `literature_review_${query.id}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Research Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Topic: <span className="font-semibold text-slate-700 dark:text-slate-300">{query.topic}</span> ({query.yearStart} - {query.yearEnd})
                    </p>
                </div>
                <div>
                    {query.status === "COMPLETED" && (
                        <Button onClick={exportCSV} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Download className="w-4 h-4" /> Export CSV
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Status:
                        {query.status === "PENDING" || query.status === "PROCESSING" ? (
                            <span className="text-indigo-600 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processing</span>
                        ) : query.status === "COMPLETED" ? (
                            <span className="text-emerald-600 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Completed</span>
                        ) : (
                            <span className="text-red-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Failed</span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {query.status === "PROCESSING" ? "Our AI is currently searching, downloading, and reviewing papers..." : "Review generated."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {query.papers.length === 0 && query.status === "COMPLETED" ? (
                            <p className="text-slate-500">No papers found matching the criteria.</p>
                        ) : (
                            query.papers.map((paper: any) => (
                                <Card key={paper.id} className="bg-slate-50 dark:bg-slate-900 overflow-hidden border-slate-200 dark:border-slate-800">
                                    <div className="p-4 md:p-6">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{paper.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{paper.authors} • DOI: {paper.doi}</p>

                                        {paper.literatureReview ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                <div className="space-y-2 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                    <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">Strengths & Findings</h4>
                                                    <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{paper.literatureReview.strengths}</p>
                                                </div>
                                                <div className="space-y-2 bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-100 dark:border-purple-900/50">
                                                    <h4 className="font-semibold text-purple-900 dark:text-purple-300">Future Work</h4>
                                                    <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">{paper.literatureReview.futureWork}</p>
                                                </div>
                                                <div className="md:col-span-2 space-y-2 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <h4 className="font-semibold text-slate-900 dark:text-slate-300">AI Summary</h4>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{paper.literatureReview.aiSummary}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing via Groq AI...
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
