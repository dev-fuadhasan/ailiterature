import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { QueryDashboardClient } from "@/app/dashboard/query/[id]/client";

export default async function QueryDashboard({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const resolvedParams = await params;
    const query = await prisma.searchQuery.findUnique({
        where: { id: resolvedParams.id },
        include: {
            papers: {
                include: {
                    literatureReview: true,
                },
            },
        },
    });

    if (!query || query.userId !== session.user.id) {
        redirect("/");
    }

    return (
        <div className="py-8">
            <QueryDashboardClient initialQuery={query} />
        </div>
    );
}
