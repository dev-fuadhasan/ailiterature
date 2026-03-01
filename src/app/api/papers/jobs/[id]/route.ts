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

  const job = await pdfResolverQueue.getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const state = await job.getState();
  const progress = typeof job.progress === "number" ? job.progress : 0;

  return NextResponse.json({
    id: job.id,
    status: state,
    progress,
    result: state === "completed" ? (job.returnvalue ?? null) : null,
    error: state === "failed" ? (job.failedReason ?? "Unknown error") : null,
    attemptsMade: job.attemptsMade,
    timestamp: {
      created: job.timestamp,
      processed: job.processedOn ?? null,
      finished: job.finishedOn ?? null,
    },
  });
}
