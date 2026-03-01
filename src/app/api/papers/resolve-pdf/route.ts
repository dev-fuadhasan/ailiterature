/**
 * POST /api/papers/resolve-pdf
 *
 * Enqueues a PDF resolution job (idempotent by doi/title hash).
 * Returns immediately with a jobId the client can poll.
 *
 * Body: PaperInput JSON
 * Response:
 *   202 { jobId }              — job enqueued / already in queue
 *   200 { jobId, status, result } — already completed (cache hit)
 *   400 { error }              — validation failure
 *   401                        — not authenticated
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { pdfResolverQueue } from "@/lib/pdf-queue";
import type { PaperInput } from "@/types/pdf-resolver";

export async function POST(request: Request) {
  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse body
  let body: PaperInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, landing_url, doi, authors, year, source } = body;

  if (!title || typeof title !== "string" || title.trim().length < 2) {
    return NextResponse.json({ error: "title is required (min 2 chars)" }, { status: 400 });
  }
  if (!landing_url || typeof landing_url !== "string") {
    return NextResponse.json({ error: "landing_url is required" }, { status: 400 });
  }

  // Idempotency key — same DOI (or title hash) reuses the same job slot
  const seed = doi ?? title.trim().toLowerCase();
  const jobId = createHash("sha256").update(seed).digest("hex").slice(0, 24);

  // Check for an existing job with this ID
  const existing = await pdfResolverQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();

    if (state === "completed") {
      return NextResponse.json({
        jobId,
        status: "completed",
        result: existing.returnvalue,
      });
    }

    if (["active", "waiting", "delayed", "prioritized"].includes(state)) {
      return NextResponse.json({ jobId, status: state }, { status: 202 });
    }

    // Failed or unknown — fall through and re-enqueue
  }

  const paperInput: PaperInput = {
    title: title.trim(),
    authors: Array.isArray(authors) ? authors : [],
    year: typeof year === "number" ? year : 0,
    doi: doi?.trim() || undefined,
    landing_url: landing_url.trim(),
    source: source?.trim() || undefined,
  };

  await pdfResolverQueue.add("resolve-pdf", paperInput, {
    jobId,
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
  });

  return NextResponse.json({ jobId }, { status: 202 });
}
