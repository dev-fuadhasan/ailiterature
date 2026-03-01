"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global error:", error);
    }, [error]);

    return (
        <html>
            <body style={{ fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", background: "#f8fafc" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b", marginBottom: "1rem" }}>Something went wrong</h1>
                <p style={{ color: "#64748b", marginBottom: "0.5rem", maxWidth: "480px" }}>
                    A server error occurred. Please try again.
                </p>
                {error.digest && (
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "1.5rem" }}>Digest: {error.digest}</p>
                )}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        onClick={reset}
                        style={{ padding: "0.5rem 1.25rem", background: "#4f46e5", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600 }}
                    >
                        Try again
                    </button>
                    <a
                        href="/"
                        style={{ padding: "0.5rem 1.25rem", background: "#e2e8f0", color: "#334155", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600, textDecoration: "none" }}
                    >
                        Go home
                    </a>
                </div>
            </body>
        </html>
    );
}
