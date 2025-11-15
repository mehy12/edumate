import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { meetingSummaries, meetings } from "@/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [row] = await db
      .select({
        ...getTableColumns(meetingSummaries),
        meetingName: meetings.name,
      })
      .from(meetingSummaries)
      .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
      .where(
        and(
          eq(meetingSummaries.id, id),
          eq(meetingSummaries.userId, session.user.id),
        ),
      );

    if (!row) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    let summaryJson;
    try {
      summaryJson = JSON.parse(row.summaryJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid roadmap data" },
        { status: 500 },
      );
    }

    // Verify roadmap data exists
    if (!summaryJson.roadmap) {
      return NextResponse.json(
        { error: "Roadmap data not found in summary" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: row.id,
      meetingId: row.meetingId,
      topic: row.topic ?? row.meetingName,
      createdAt: row.createdAt.toISOString(),
      roadmap: summaryJson.roadmap,
      recommended_classes: summaryJson.recommended_classes || null,
      student_summary: summaryJson.student_summary || null,
    });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap" },
      { status: 500 },
    );
  }
}

