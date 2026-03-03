import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id: userId } = await params;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        projects: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                projectPapers: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error("[Admin User Detail] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user and all related data
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id: userId } = await params;

    console.log(`[Admin] Starting deletion for user: ${userId}`);

    // Check if user exists
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        projects: {
          include: {
            projectPapers: {
              include: {
                paper: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Collect all paper IDs from user's projects
    const paperIds = new Set<string>();
    for (const project of profile.projects) {
      for (const pp of project.projectPapers) {
        paperIds.add(pp.paperId);
      }
    }

    console.log(`[Admin] User has ${profile.projects.length} projects with ${paperIds.size} unique papers`);

    // For each paper, check if it's used only by this user's projects
    const papersToDelete: string[] = [];
    const s3KeysToDelete: string[] = [];

    for (const paperId of paperIds) {
      // Count how many projects (from any user) use this paper
      const projectCount = await prisma.projectPaper.count({
        where: { paperId },
      });

      // Count how many of those are from THIS user
      const userProjectCount = await prisma.projectPaper.count({
        where: {
          paperId,
          project: {
            userId,
          },
        },
      });

      // If all references are from this user, we can delete the paper
      if (projectCount === userProjectCount) {
        papersToDelete.push(paperId);

        // Get the paper's S3 key for deletion
        const paper = await prisma.paper.findUnique({
          where: { id: paperId },
          select: { s3Key: true },
        });

        if (paper?.s3Key) {
          s3KeysToDelete.push(paper.s3Key);
        }
      }
    }

    console.log(`[Admin] Will delete ${papersToDelete.length} papers and ${s3KeysToDelete.length} S3 files`);

    // Start deletion process (in transaction where possible)
    await prisma.$transaction(async (tx) => {
      // 1. Delete all project papers for this user's projects
      await tx.projectPaper.deleteMany({
        where: {
          project: {
            userId,
          },
        },
      });

      // 2. Delete all projects
      await tx.project.deleteMany({
        where: { userId },
      });

      // 3. Delete extractions for papers that will be deleted
      await tx.extraction.deleteMany({
        where: {
          paperId: {
            in: papersToDelete,
          },
        },
      });

      // 4. Delete papers that are only used by this user
      await tx.paper.deleteMany({
        where: {
          id: {
            in: papersToDelete,
          },
        },
      });

      // 5. Delete the user profile
      await tx.profile.delete({
        where: { userId },
      });
    });

    // 6. Delete S3 files (outside transaction as it's external service)
    console.log(`[Admin] Deleting ${s3KeysToDelete.length} files from R2...`);
    for (const s3Key of s3KeysToDelete) {
      try {
        await deleteFromR2(s3Key);
      } catch (error) {
        console.error(`[Admin] Failed to delete S3 key ${s3Key}:`, error);
        // Continue with other deletions
      }
    }

    console.log(`[Admin] Successfully deleted user ${userId} and all related data`);

    return NextResponse.json({
      success: true,
      deleted: {
        projects: profile.projects.length,
        papers: papersToDelete.length,
        files: s3KeysToDelete.length,
      },
    });
  } catch (error) {
    console.error("[Admin User Delete] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
