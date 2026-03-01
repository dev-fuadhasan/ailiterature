import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { getResearchQueue } from "@/lib/queue";

// POST /api/projects/[id]/resume
// Resets a STOPPED project and re-queues it. The worker skips already-analyzed
// papers (those with an existing extraction + s3Key) and resumes from where it left off.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (project.status !== "STOPPED") {
    return NextResponse.json({ error: "Project is not stopped" }, { status: 400 });
  }

  // Reset project to PENDING — clear jobId so the worker fallback can pick it up
  // if the BullMQ queue is unavailable in the web runtime.
  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: "PENDING",
      stopRequested: false,
      errorMessage: null,
      processedPapers: 0,
      failedPapers: 0,
      jobId: null,           // ← critical: lets the fallback poller find this project
    },
  });

  // Try to re-queue via BullMQ (may not be available in all environments)
  const queue = getResearchQueue();
  if (queue) {
    try {
      const job = await queue.add(
        "research",
        {
          projectId: id,
          userId: user.id,
          topic: project.topic,
          yearFrom: project.yearFrom,
          yearTo: project.yearTo,
          maxPapers: project.maxPapers,
        },
        { jobId: `${id}-resume-${Date.now()}` }
      );
      await prisma.project.update({
        where: { id },
        data: { jobId: job.id },
      });
    } catch (queueErr) {
      // Queue add failed — leave jobId as null so the fallback poller picks it up
      console.error("[Resume] Queue add failed, fallback will handle:", queueErr);
    }
  }

  return NextResponse.json({ success: true, status: updated.status });
}
