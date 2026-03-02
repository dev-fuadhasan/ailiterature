import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_code = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle OAuth errors
  if (error_code) {
    console.error("OAuth error:", error_code, error_description);
    return NextResponse.redirect(`${origin}/login?error=${error_code}`);
  }

  if (!code) {
    console.error("No code provided in callback");
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Session exchange error:", error);
      return NextResponse.redirect(`${origin}/login?error=session_error`);
    }

    if (!data.user) {
      console.error("No user data after session exchange");
      return NextResponse.redirect(`${origin}/login?error=no_user`);
    }

    // Upsert profile with error handling
    try {
      await prisma.profile.upsert({
        where: { userId: data.user.id },
        create: {
          userId: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
        },
        update: {
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
          avatarUrl: data.user.user_metadata?.avatar_url || null,
        },
      });
    } catch (dbError) {
      console.error("Database error creating profile:", dbError);
      // Continue anyway - user is authenticated
    }

    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=unknown`);
  }
}
