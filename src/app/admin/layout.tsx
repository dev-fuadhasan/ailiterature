import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/secretlogin");
  }

  return <>{children}</>;
}
