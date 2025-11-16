import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { channels, channelMembers, user } from "@/db/schema";
import { and, eq, count, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get current user's region
    const [currentUser] = await db
      .select({ region: user.region })
      .from(user)
      .where(eq(user.id, session.user.id));

    const userRegion = currentUser?.region || "Bangalore";

    // Get channels in user's region with member count
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
      .where(eq(channels.region, userRegion))
      .orderBy(desc(channels.createdAt));

    return NextResponse.json(channelsList);
  } catch (error) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 },
      );
    }

    // Get current user's region
    const [currentUser] = await db
      .select({ region: user.region })
      .from(user)
      .where(eq(user.id, session.user.id));

    const userRegion = currentUser?.region || "Bangalore";

    // Create channel
    const [newChannel] = await db
      .insert(channels)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        region: userRegion,
        createdByUserId: session.user.id,
        createdAt: new Date(),
      })
      .returning();

    // Add creator as member
    await db.insert(channelMembers).values({
      channelId: newChannel.id,
      userId: session.user.id,
      joinedAt: new Date(),
    });

    // Return channel with member count
    const [channelWithCount] = await db
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
      .where(eq(channels.id, newChannel.id));

    return NextResponse.json(channelWithCount, { status: 201 });
  } catch (error) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 },
    );
  }
}

