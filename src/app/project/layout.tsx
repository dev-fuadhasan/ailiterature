import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, LayoutDashboard, PlusCircle } from "lucide-react";

export default async function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">LiteratureAI</span>
          </Link>
        </div>
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
      <main className="flex-1 ml-64 min-h-screen">{children}</main>
    </div>
  );
}
