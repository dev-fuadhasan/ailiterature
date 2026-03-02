import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, PlusCircle, LogOut, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { SubscriptionSettings } from "@/components/subscription-settings";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your research projects and literature reviews in Research Room AI dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile to get plan information
  let profile;
  try {
    profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: {
        planType: true,
        planPeriod: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionId: true,
        paymentMethodId: true,
        cardLast4: true,
        cardType: true,
        cardExpiryMonth: true,
        cardExpiryYear: true,
        autoRenewal: true,
      }
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }

  const planType = (profile as any)?.planType || "FREE";
  const planPeriod = (profile as any)?.planPeriod;
  const subscriptionStatus = (profile as any)?.subscriptionStatus;
  const isPremium = planType === "PREMIUM" && subscriptionStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="inline-block">
            <Image 
              src="/logo.png" 
              alt="Research Room AI Logo" 
              width={100} 
              height={100}
              className="object-contain"
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            My Reviews
          </Link>
          <Link
            href="/project/new"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Review
          </Link>
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-blue-700">
                {(user.user_metadata?.full_name || user.user_metadata?.name || user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {(user.user_metadata?.full_name || user.user_metadata?.name) && (
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {user.user_metadata?.full_name || user.user_metadata?.name}
                </p>
              )}
              <p className="text-xs text-gray-500 truncate leading-tight">{user.email}</p>
              
              {/* Plan Badge */}
              <div className="mt-1.5">
                {isPremium ? (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-[10px] py-0 px-1.5 h-5">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium {planPeriod === "YEARLY" ? "Yearly" : "Monthly"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-600 border-gray-300 text-[10px] py-0 px-1.5 h-5">
                    <Zap className="h-3 w-3 mr-1" />
                    Free Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Settings Button (for premium users) */}
          <SubscriptionSettings
            userId={user.id}
            email={user.email || ''}
            subscriptionStartDate={(profile as any)?.subscriptionStartDate || null}
            subscriptionId={(profile as any)?.subscriptionId || null}
            planPeriod={(profile as any)?.planPeriod || null}
            isPremium={isPremium}
            paymentMethodId={(profile as any)?.paymentMethodId || null}
            cardLast4={(profile as any)?.cardLast4 || null}
            cardType={(profile as any)?.cardType || null}
            cardExpiryMonth={(profile as any)?.cardExpiryMonth || null}
            cardExpiryYear={(profile as any)?.cardExpiryYear || null}
            autoRenewal={(profile as any)?.autoRenewal ?? true}
          />
          
          <form action="/auth/signout" method="post">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
              formAction={async () => {
                "use server";
                const supabase2 = await createClient();
                await supabase2.auth.signOut();
                redirect("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
