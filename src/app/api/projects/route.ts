import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { researchQueue } from "@/lib/queue";

// GET /api/projects — list user's projects
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(projects);
}

// POST /api/projects — create a new project and enqueue job
export async function POST(request: Request) {
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

  // Ensure profile exists
  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, email: user.email! },
    update: {},
  });

  // Create project
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

  // Enqueue the research job
  const job = await researchQueue.add("process-project", {
    projectId: project.id,
    userId: user.id,
    topic: topic.trim(),
    yearFrom,
    yearTo,
    maxPapers: Math.min(maxPapers || 100, 200),
  });

  // Save job ID to project
  await prisma.project.update({
    where: { id: project.id },
    data: { jobId: job.id?.toString() },
  });

  return NextResponse.json({ projectId: project.id }, { status: 201 });
}
