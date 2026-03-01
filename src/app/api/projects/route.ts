import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { getResearchQueue } from "@/lib/queue";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// GET /api/projects — list user's projects
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: {
        select: {
          projectPapers: { where: { extractionStatus: "COMPLETED" } },
        },
      },
    },
  });

  // Replace processedPapers with the actual count of completed project papers
  const result = projects.map(({ _count, ...p }) => ({
    ...p,
    processedPapers: _count.projectPapers,
  }));

  return NextResponse.json(result);
}

// POST /api/projects — create a new project and enqueue job
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { topic, yearFrom, yearTo, maxPapers } = body;

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json({ error: "Topic must be at least 3 characters" }, { status: 400 });
    }

    if (yearFrom > yearTo) {
      return NextResponse.json({ error: "Year from must be before year to" }, { status: 400 });
    }

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, email: user.email! },
      update: {},
    });

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        topic: topic.trim(),
        yearFrom,
        yearTo,
        maxPapers: Math.min(maxPapers || 100, 200),
        status: "PENDING",
      },
    });

    const queue = getResearchQueue();
    if (!queue) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          errorMessage: "Queue unavailable in web runtime. Worker fallback will pick this project shortly.",
        },
      });
      return NextResponse.json({ projectId: project.id, queued: false }, { status: 201 });
    }

    try {
      const job = await withTimeout(
        queue.add("process-project", {
          projectId: project.id,
          userId: user.id,
          topic: topic.trim(),
          yearFrom,
          yearTo,
          maxPapers: Math.min(maxPapers || 100, 200),
        }),
        8000,
        "Queue enqueue timed out"
      );

      await prisma.project.update({
        where: { id: project.id },
        data: { jobId: job.id?.toString(), errorMessage: null },
      });
      return NextResponse.json({ projectId: project.id, queued: true }, { status: 201 });
    } catch (error) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          errorMessage: `Queue enqueue failed; fallback processing will retry: ${error instanceof Error ? error.message : "unknown"}`,
        },
      });
      return NextResponse.json({ projectId: project.id, queued: false }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
