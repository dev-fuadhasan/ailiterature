import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import prisma from "@/lib/prisma";

// GET /api/admin/users - List all users with their stats
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const users = await prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    const usersWithStats = users.map((user) => ({
      id: user.id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      planType: user.planType,
      subscriptionStatus: user.subscriptionStatus,
      literatureReviewCount: user.literatureReviewCount,
      projectCount: user._count.projects,
      createdAt: user.createdAt,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      paddleCustomerId: user.paddleCustomerId,
    }));

    return NextResponse.json({ users: usersWithStats });
  } catch (error) {
    console.error("[Admin Users] Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
