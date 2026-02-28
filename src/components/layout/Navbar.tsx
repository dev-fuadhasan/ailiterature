"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link href="/" className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-6 w-6" />
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">LitReview<span className="text-indigo-600 dark:text-indigo-400">AI</span></span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="text-sm font-medium hover:text-indigo-600 transition-colors">
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => signIn("google")}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
