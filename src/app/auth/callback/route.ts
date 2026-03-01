import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Upsert profile
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

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
