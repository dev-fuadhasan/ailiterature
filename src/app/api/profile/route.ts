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

    // Fetch or create profile with explicit field casting
    let profile;
    try {
      profile = await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
        update: {},
      });
    } catch (dbError: any) {
      console.error("Database upsert error:", dbError);
      
      // If columns don't exist, return default free tier
      return NextResponse.json({
        userId: user.id,
        planType: "FREE",
        planPeriod: null,
        subscriptionStatus: "TRIALING",
        subscriptionId: null,
        literatureReviewCount: 0,
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        email: user.email,
        name: user.user_metadata?.name || user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
    }

    // Calculate trial end date if not set (30 days from trial start)
    const trialStart = (profile as any).trialStartDate || profile.createdAt;
    const trialEnd = (profile as any).trialEndDate || new Date(new Date(trialStart).getTime() + 30 * 24 * 60 * 60 * 1000);

    // Type-safe response with proper fields from updated schema
    return NextResponse.json({
      userId: profile.userId,
      planType: (profile as any).planType || "FREE",
      planPeriod: (profile as any).planPeriod || null,
      subscriptionStatus: (profile as any).subscriptionStatus || "TRIALING",
      subscriptionId: (profile as any).subscriptionId || null,
      literatureReviewCount: (profile as any).literatureReviewCount || 0,
      trialStartDate: trialStart,
      trialEndDate: trialEnd,
      subscriptionStartDate: (profile as any).subscriptionStartDate || null,
      subscriptionEndDate: (profile as any).subscriptionEndDate || null,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
  } catch (error: any) {
    console.error("Failed to fetch profile:", error);
    
    // If database schema is outdated, return default free tier data
    if (error?.code === '42703' || error?.message?.includes('column')) {
      console.warn("Database schema outdated - using default values");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        return NextResponse.json({
          userId: user.id,
          planType: "FREE",
          planPeriod: null,
          subscriptionStatus: "TRIALING",
          subscriptionId: null,
          literatureReviewCount: 0,
          trialStartDate: new Date().toISOString(),
          trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        });
      }
    }
    
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error?.message },
      { status: 500 }
    );
  }
}
