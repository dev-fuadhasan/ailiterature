"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function QueryError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center py-16">
            <AlertCircle className="w-14 h-14 text-red-400" />
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                    Failed to load the research dashboard. This is usually a temporary issue.
                </p>
                {error.digest && (
                    <p className="text-xs text-slate-400 mt-2">Digest: {error.digest}</p>
                )}
            </div>
            <div className="flex gap-3">
                <Button onClick={reset} variant="outline">Try Again</Button>
                <Link href="/dashboard">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Back to Dashboard</Button>
                </Link>
            </div>
        </div>
    );
}
