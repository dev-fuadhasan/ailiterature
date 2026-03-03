"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, PlusCircle, LogOut, Crown, Zap, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionSettings } from "@/components/subscription-settings";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push("/login");
        return;
      }

      setUser(authUser);

      // Fetch profile
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const profileData = await res.json();
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
      
      setLoading(false);
    }
    
    loadUser();
  }, [router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const planType = profile?.planType || "FREE";
  const planPeriod = profile?.planPeriod;
  const subscriptionStatus = profile?.subscriptionStatus;
  const isPremium = planType === "PREMIUM" && subscriptionStatus === "ACTIVE";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="inline-block">
          <Image 
            src="/logo.png" 
            alt="Research Room AI Logo" 
            width={80} 
            height={80}
            className="object-contain"
          />
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="inline-block" onClick={() => setSidebarOpen(false)}>
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
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            My Reviews
          </Link>
          <Link
            href="/project/new"
            onClick={() => setSidebarOpen(false)}
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
            subscriptionStartDate={profile?.subscriptionStartDate || null}
            subscriptionId={profile?.subscriptionId || null}
            planPeriod={profile?.planPeriod || null}
            isPremium={isPremium}
            paymentMethodId={profile?.paymentMethodId || null}
            cardLast4={profile?.cardLast4 || null}
            cardType={profile?.cardType || null}
            cardExpiryMonth={profile?.cardExpiryMonth || null}
            cardExpiryYear={profile?.cardExpiryYear || null}
            autoRenewal={profile?.autoRenewal ?? true}
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-h-screen pt-16 lg:pt-0 lg:ml-64">
        {children}
      </main>
    </div>
  );
}
