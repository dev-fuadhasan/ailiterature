import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { topic, yearStart, yearEnd, quartiles } = body;

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const searchQuery = await prisma.searchQuery.create({
            data: {
                userId: session.user.id,
                topic,
                yearStart,
                yearEnd,
                quartiles,
                status: "PENDING",
            },
        });

        return NextResponse.json({ id: searchQuery.id });
    } catch (error) {
        console.error("[SEARCH_API_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
