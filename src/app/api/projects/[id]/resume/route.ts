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

  // Reset project to PENDING so the worker can pick it back up
  const updated = await prisma.project.update({
    where: { id },
    data: {
      status: "PENDING",
      stopRequested: false,
      errorMessage: null,
      processedPapers: 0,
      failedPapers: 0,
    },
  });

  // Re-queue the job
  const queue = getResearchQueue();
  if (queue) {
    const jobId = await queue.add(
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
      data: { jobId: jobId.id },
    });
  }

  return NextResponse.json({ success: true, status: updated.status });
}
