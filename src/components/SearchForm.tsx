"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function SearchForm() {
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [yearStart, setYearStart] = useState<string>("2020");
    const [yearEnd, setYearEnd] = useState<string>(new Date().getFullYear().toString());
    const [quartiles, setQuartiles] = useState<string[]>(["Q1", "Q2"]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuartileChange = (q: string, checked: boolean) => {
        if (checked) {
            setQuartiles([...quartiles, q]);
        } else {
            setQuartiles(quartiles.filter((x) => x !== q));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic) return;
        setIsSubmitting(true);

        // Create query record via Next.js API
        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic,
                    yearStart: parseInt(yearStart),
                    yearEnd: parseInt(yearEnd),
                    quartiles,
                }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/dashboard/query/${data.id}`);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                    <Search className="w-6 h-6 text-indigo-500" />
                    Start Literature Review
                </CardTitle>
                <CardDescription className="text-center text-slate-500 text-base">
                    Define your research topic and criteria to automate the discovery and synthesis of academic papers.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="topic" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Research Topic
                        </label>
                        <Input
                            id="topic"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Transformer Models in Natural Language Processing"
                            required
                            className="text-lg py-6"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="yearStart" className="text-sm font-medium">Start Year</label>
                            <Input
                                id="yearStart"
                                type="number"
                                min="1900"
                                max="2100"
                                value={yearStart}
                                onChange={(e) => setYearStart(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="yearEnd" className="text-sm font-medium">End Year</label>
                            <Input
                                id="yearEnd"
                                type="number"
                                min="1900"
                                max="2100"
                                value={yearEnd}
                                onChange={(e) => setYearEnd(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium">Rankings / Quartiles</p>
                        <div className="flex gap-6">
                            {["Q1", "Q2", "Q3"].map((q) => (
                                <div key={q} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`quartile-${q}`}
                                        checked={quartiles.includes(q)}
                                        onCheckedChange={(checked) => handleQuartileChange(q, checked as boolean)}
                                    />
                                    <label htmlFor={`quartile-${q}`} className="text-sm font-medium cursor-pointer">
                                        {q}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleSubmit}
                    disabled={!topic || isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-6 text-lg"
                >
                    {isSubmitting ? "Initiating Research..." : "Discover & Analyze Papers"}
                </Button>
            </CardFooter>
        </Card>
    );
}
