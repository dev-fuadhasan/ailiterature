import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/admin-auth";

// GET /api/admin/users - List all users
export async function GET() {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const users = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        email: true,
        planType: true,
        planPeriod: true,
        subscriptionStatus: true,
        literatureReviewCount: true,
        trialStartDate: true,
        subscriptionId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get project counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const projectCount = await prisma.project.count({
          where: { userId: user.userId },
        });
        return { ...user, projectCount };
      })
    );

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    console.error("[Admin] Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
