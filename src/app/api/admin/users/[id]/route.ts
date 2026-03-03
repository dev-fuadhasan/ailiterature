import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { id: userId } = await params;

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { projectPapers: true },
        },
      },
    });

    const totalPapers = await prisma.projectPaper.count({
      where: {
        project: { userId },
      },
    });

    return NextResponse.json({
      profile,
      projects,
      totalPapers,
    });
  } catch (error) {
    console.error("[Admin] Error fetching user details:", error);
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
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { id: userId } = await params;

    // Get user's projects to find PDFs in R2
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        projectPapers: {
          include: {
            paper: true,
          },
        },
      },
    });

    // Delete PDFs from R2 storage
    if (process.env.R2_BUCKET_NAME) {
      for (const project of projects) {
        for (const pp of project.projectPapers) {
          if (pp.paper.s3Key) {
            try {
              await s3Client.send(
                new DeleteObjectCommand({
                  Bucket: process.env.R2_BUCKET_NAME,
                  Key: pp.paper.s3Key,
                })
              );
              console.log(`[Admin] Deleted R2 object: ${pp.paper.s3Key}`);
            } catch (err) {
              console.warn(`[Admin] Failed to delete R2 object ${pp.paper.s3Key}:`, err);
            }
          }
        }
      }
    }

    // Delete all database records (cascade will handle related records)
    // Order matters: delete child records first
    await prisma.$transaction(async (tx) => {
      // Delete project papers
      await tx.projectPaper.deleteMany({
        where: { project: { userId } },
      });

      // Delete projects
      await tx.project.deleteMany({
        where: { userId },
      });

      // Delete profile
      await tx.profile.delete({
        where: { userId },
      });
    });

    // Delete user from Supabase auth
    try {
      const supabase = await createClient();
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.warn(`[Admin] Failed to delete Supabase user ${userId}:`, authError);
      }
    } catch (err) {
      console.warn(`[Admin] Failed to delete Supabase user ${userId}:`, err);
    }

    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully",
    });
  } catch (error) {
    console.error("[Admin] Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users/[id] - Update user subscription
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { planType, planPeriod, subscriptionStatus } = body;

    if (!planType || !subscriptionStatus) {
      return NextResponse.json(
        { error: "planType and subscriptionStatus are required" },
        { status: 400 }
      );
    }

    const validPlanTypes = ["FREE", "PREMIUM"];
    const validPlanPeriods = ["MONTHLY", "YEARLY", null];
    const validStatuses = ["ACTIVE", "CANCELLED", "PAST_DUE", "TRIALING", "EXPIRED"];

    if (!validPlanTypes.includes(planType) || !validStatuses.includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: "Invalid planType or subscriptionStatus" },
        { status: 400 }
      );
    }

    if (planPeriod && !validPlanPeriods.includes(planPeriod)) {
      return NextResponse.json(
        { error: "Invalid planPeriod" },
        { status: 400 }
      );
    }

    const updateData: any = {
      planType,
      subscriptionStatus,
      updatedAt: new Date(),
    };

    // Only update planPeriod for PREMIUM plans
    if (planType === "PREMIUM" && planPeriod) {
      updateData.planPeriod = planPeriod;
    } else if (planType === "FREE") {
      updateData.planPeriod = null;
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("[Admin] Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
