import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

// POST /api/projects/[id]/stop
export async function POST(
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

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow stopping active jobs
  const activeStatuses = ["PENDING", "SEARCHING", "DOWNLOADING", "ANALYZING"];
  if (!activeStatuses.includes(project.status)) {
    return NextResponse.json(
      { error: "Project is not running" },
      { status: 400 }
    );
  }

  await prisma.project.update({
    where: { id },
    data: { stopRequested: true },
  });

  return NextResponse.json({ success: true });
}
