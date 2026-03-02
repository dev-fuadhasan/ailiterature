/**
 * GET /api/papers/jobs/[id]
 *
 * Poll the status of a PDF resolution job.
 *
 * Response:
 *   { id, status, progress, result?, error? }
 *   status: "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown"
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pdfResolverQueue } from "@/lib/pdf-queue";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 30 job status checks per minute per user
  const rateLimitResult = rateLimit(user.id, { limit: 30, window: 60000 });
  if (rateLimitResult) return rateLimitResult;

  const job = await pdfResolverQueue.getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const state = await job.getState();
  const progress = typeof job.progress === "number" ? job.progress : 0;

  // Sanitize result to prevent exposing external API URLs (Unpaywall, OpenAlex, etc.)
  let sanitizedResult = null;
  if (state === "completed" && job.returnvalue) {
    const result = job.returnvalue;
    sanitizedResult = {
      status: result.status,
      // Never expose the external pdf_url or final_url to prevent API discovery
      hasPdf: result.status === "DOWNLOADED",
      reason: result.status === "NO_PUBLIC_PDF" || result.status === "FAILED" ? result.reason : null,
      // Hide evidence.method to prevent revealing which API source was used
      method: null,
    };
  }

  return NextResponse.json({
    id: job.id,
    status: state,
    progress,
    result: sanitizedResult,
    error: state === "failed" ? (job.failedReason ?? "Unknown error") : null,
    attemptsMade: job.attemptsMade,
    timestamp: {
      created: job.timestamp,
      processed: job.processedOn ?? null,
      finished: job.finishedOn ?? null,
    },
  });
}
