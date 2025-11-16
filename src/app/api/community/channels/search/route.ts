import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { channels, channelMembers } from "@/db/schema";
import { ilike, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q") || "";

  try {
    if (!query.trim()) {
      return NextResponse.json([]);
    }

    // Search channels across all regions by name (case-insensitive)
    const channelsList = await db
      .select({
        id: channels.id,
        name: channels.name,
        description: channels.description,
        region: channels.region,
        createdAt: channels.createdAt,
        memberCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${channelMembers}
          WHERE ${channelMembers.channelId} = ${channels.id}
        )`.as("memberCount"),
      })
      .from(channels)
      .where(ilike(channels.name, `%${query.trim()}%`))
      .orderBy(desc(channels.createdAt))
      .limit(50);

    return NextResponse.json(channelsList);
  } catch (error) {
    console.error("Error searching channels:", error);
    return NextResponse.json(
      { error: "Failed to search channels" },
      { status: 500 },
    );
  }
}

