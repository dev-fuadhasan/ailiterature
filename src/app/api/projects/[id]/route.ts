import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

type PPWithPaper = Awaited<ReturnType<typeof prisma.projectPaper.findMany<{
  include: { paper: { include: { extraction: true } } };
}>>>[0];

// GET /api/projects/[id]
export async function GET(
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

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let effectiveProject = project;
  const pendingMs = Date.now() - new Date(project.createdAt).getTime();
  if (project.status === "PENDING" && pendingMs > 90_000) {
    effectiveProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "FAILED",
        errorMessage:
          "Job stayed queued too long. Worker may be offline or connected to a different database/redis configuration.",
      },
    });
  }

  const projectPapers = await prisma.projectPaper.findMany({
    where: { projectId: id },
    include: {
      paper: {
        include: { extraction: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const papers = projectPapers.map((pp: PPWithPaper) => ({
    id: pp.paper.id,
    doi: pp.paper.doi,
    title: pp.paper.title,
    authors: pp.paper.authors,
    year: pp.paper.year,
    journal: pp.paper.journal,
    abstract: pp.paper.abstract,
    citationCount: pp.paper.citationCount,
    isOpenAccess: pp.paper.isOpenAccess,
    quartile: pp.paper.quartile,
    extraction: pp.paper.extraction
      ? {
          methodology: pp.paper.extraction.methodology,
          findings: pp.paper.extraction.findings,
          limitations: pp.paper.extraction.limitations,
          futureWork: pp.paper.extraction.futureWork,
          studyType: pp.paper.extraction.studyType,
          keywords: pp.paper.extraction.keywords,
          isAbstractOnly: pp.paper.extraction.isAbstractOnly,
        }
      : null,
    extractionStatus: pp.extractionStatus,
  }));

  // Override processedPapers with the ground-truth count derived from actual
  // paper extraction statuses. This prevents drift caused by resume resets or
  // partial worker crashes making the DB counter diverge from reality.
  const actualProcessed = papers.filter((p) => p.extractionStatus === "COMPLETED").length;

  return NextResponse.json({ ...effectiveProject, papers, processedPapers: actualProcessed });
}

// DELETE /api/projects/[id]
export async function DELETE(
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

  // Delete in order: extractions → projectPapers → project
  const projectPapers = await prisma.projectPaper.findMany({
    where: { projectId: id },
    select: { paperId: true },
  });
  const paperIds = projectPapers.map((pp: { paperId: string }) => pp.paperId);

  // Find papers with R2 objects that are exclusive to this project
  const exclusivePapers = await prisma.paper.findMany({
    where: {
      id: { in: paperIds },
      s3Key: { not: null },
      projectPapers: { none: { projectId: { not: id } } },
    },
    select: { s3Key: true },
  });

  await prisma.extraction.deleteMany({ where: { paperId: { in: paperIds } } });
  await prisma.projectPaper.deleteMany({ where: { projectId: id } });

  // Delete orphaned papers (no longer referenced by any project)
  await prisma.paper.deleteMany({
    where: { id: { in: paperIds }, projectPapers: { none: {} } },
  });

  await prisma.project.delete({ where: { id } });

  // Clean up R2 after DB rows are gone (non-blocking; ignore errors)
  for (const paper of exclusivePapers) {
    if (paper.s3Key) deleteFromR2(paper.s3Key).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
