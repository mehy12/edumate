import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { channels, channelMembers, channelMessages, user } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";

export async function GET(
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

    // Get messages with sender info
    const messages = await db
      .select({
        id: channelMessages.id,
        content: channelMessages.content,
        createdAt: channelMessages.createdAt,
        userId: channelMessages.userId,
        userName: user.name,
        userImage: user.image,
      })
      .from(channelMessages)
      .innerJoin(user, eq(channelMessages.userId, user.id))
      .where(eq(channelMessages.channelId, channelId))
      .orderBy(asc(channelMessages.createdAt))
      .limit(100);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

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
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 },
      );
    }

    // Check if channel exists
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, channelId));

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user is a member, if not, auto-join
    const [existingMember] = await db
      .select()
      .from(channelMembers)
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          eq(channelMembers.userId, session.user.id),
        ),
      );

    if (!existingMember) {
      // Auto-join the channel
      await db.insert(channelMembers).values({
        channelId,
        userId: session.user.id,
        joinedAt: new Date(),
      });
    }

    // Create message
    const [newMessage] = await db
      .insert(channelMessages)
      .values({
        channelId,
        userId: session.user.id,
        content: content.trim(),
        createdAt: new Date(),
      })
      .returning();

    // Get message with sender info
    const [messageWithUser] = await db
      .select({
        id: channelMessages.id,
        content: channelMessages.content,
        createdAt: channelMessages.createdAt,
        userId: channelMessages.userId,
        userName: user.name,
        userImage: user.image,
      })
      .from(channelMessages)
      .innerJoin(user, eq(channelMessages.userId, user.id))
      .where(eq(channelMessages.id, newMessage.id));

    return NextResponse.json(messageWithUser, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

