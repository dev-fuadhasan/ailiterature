import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { stringify } from "csv-stringify/sync";
import { formatAuthors } from "@/lib/utils";

type PPWithPaper = Awaited<ReturnType<typeof prisma.projectPaper.findMany<{
  include: { paper: { include: { extraction: true } } };
}>>>[0];

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
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectPapers = await prisma.projectPaper.findMany({
    where: { projectId: id, extractionStatus: "COMPLETED" },
    include: { paper: { include: { extraction: true } } },
    orderBy: { createdAt: "asc" },
  });

  const rows = projectPapers.map((pp: PPWithPaper, idx: number) => {
    const paper = pp.paper;
    const ext = paper.extraction;
    return {
      "#": idx + 1,
      Title: paper.title,
      Authors: formatAuthors(paper.authors as unknown[]),
      Year: paper.year ?? "",
      Journal: paper.journal ?? "",
      DOI: paper.doi ?? "",
      Abstract: paper.abstract ?? "",
      "Citation Count": paper.citationCount ?? "",
      "Open Access": paper.isOpenAccess ? "Yes" : "No",
      Quartile: paper.quartile ?? "N/A",
      "Study Type": ext?.studyType ?? "",
      Methodology: ext?.methodology ?? "",
      Findings: ext?.findings ?? "",
      Limitations: ext?.limitations ?? "",
      "Future Work": ext?.futureWork ?? "",
      Keywords: Array.isArray(ext?.keywords) ? (ext.keywords as string[]).join("; ") : "",
      "Analysis Type": ext?.isAbstractOnly ? "Abstract Only" : ext ? "Full Text" : "Not analyzed",
      "Extraction Status": pp.extractionStatus,
    };
  });

  const csv = stringify(rows, { header: true });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="literature-review-${project.topic.slice(0, 30).replace(/[^a-zA-Z0-9]/g, "-")}.csv"`,
    },
  });
}
