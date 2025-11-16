import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { channels, channelMembers } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> },
) {
  const { channelId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select()
      .from(channelMembers)
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          eq(channelMembers.userId, session.user.id),
        ),
      );

    if (existingMember) {
      return NextResponse.json({
        message: "Already a member",
        channelId,
        userId: session.user.id,
      });
    }

    // Add user as member
    await db.insert(channelMembers).values({
      channelId,
      userId: session.user.id,
      joinedAt: new Date(),
    });

    // Get updated member count
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
      .where(eq(channels.id, channelId));

    return NextResponse.json({
      message: "Joined channel successfully",
      channel: channelWithCount,
    });
  } catch (error) {
    console.error("Error joining channel:", error);
    return NextResponse.json(
      { error: "Failed to join channel" },
      { status: 500 },
    );
  }
}

