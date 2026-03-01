import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const queries = await prisma.searchQuery.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { papers: true } } },
    });

    const statusIcon = (status: string) => {
        if (status === "COMPLETED") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (status === "FAILED") return <AlertCircle className="w-4 h-4 text-red-500" />;
        return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
    };

    const statusColor = (status: string) => {
        if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
        if (status === "FAILED") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    };

    return (
        <div className="py-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-indigo-500" />
                    My Research Queries
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    All your literature review sessions. Click any to view results.
                </p>
            </div>

            {queries.length === 0 ? (
                <Card className="text-center py-16">
                    <CardContent>
                        <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No research queries yet.</p>
                        <Link href="/" className="mt-4 inline-block text-indigo-600 hover:underline font-medium">
                            Start your first literature review →
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {queries.map((query) => (
                        <Link key={query.id} href={`/dashboard/query/${query.id}`}>
                            <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer dark:hover:border-indigo-700">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <CardTitle className="text-lg text-slate-900 dark:text-white">
                                            {query.topic}
                                        </CardTitle>
                                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusColor(query.status)}`}>
                                            {statusIcon(query.status)}
                                            {query.status}
                                        </span>
                                    </div>
                                    <CardDescription className="flex items-center gap-4 text-sm mt-1">
                                        <span>{query.yearStart} – {query.yearEnd}</span>
                                        <span>{query.quartiles?.join(", ")}</span>
                                        <span>{query._count.papers} paper{query._count.papers !== 1 ? "s" : ""}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(query.createdAt).toLocaleString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
