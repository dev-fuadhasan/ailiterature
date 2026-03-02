import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch or create profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      update: {},
    });

    // Type-safe response with proper fields from updated schema
    return NextResponse.json({
      userId: profile.userId,
      planType: (profile as any).planType || "FREE",
      planPeriod: (profile as any).planPeriod || null,
      subscriptionStatus: (profile as any).subscriptionStatus || "TRIALING",
      subscriptionId: (profile as any).subscriptionId || null,
      literatureReviewCount: (profile as any).literatureReviewCount || 0,
      trialStartDate: (profile as any).trialStartDate || profile.createdAt,
      trialEndDate: (profile as any).trialEndDate || null,
      subscriptionStartDate: (profile as any).subscriptionStartDate || null,
      subscriptionEndDate: (profile as any).subscriptionEndDate || null,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
