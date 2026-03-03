"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, PlusCircle, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
      setLoading(false);
    }
    
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

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

      <aside className={`
        w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
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
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-700">
                {(user.user_metadata?.full_name || user.user_metadata?.name || user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {(user.user_metadata?.full_name || user.user_metadata?.name) && (
                <p className="text-xs font-semibold text-gray-800 truncate leading-tight">
                  {user.user_metadata?.full_name || user.user_metadata?.name}
                </p>
              )}
              <p className="text-xs text-gray-400 truncate leading-tight">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-h-screen pt-16 lg:pt-0 lg:ml-64">{children}</main>
    </div>
  );
}
