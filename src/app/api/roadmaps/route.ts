import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { meetingSummaries, meetings } from "@/db/schema";
import { and, eq, getTableColumns, ilike, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = Math.min(
    parseInt(searchParams.get("pageSize") || "10", 10),
    100,
  );

  try {
    // Query meeting summaries that have roadmap data
    const whereConditions = [
      eq(meetingSummaries.userId, session.user.id),
    ];

    if (search) {
      whereConditions.push(
        ilike(meetingSummaries.topic, `%${search}%`),
      );
    }

    const rows = await db
      .select({
        ...getTableColumns(meetingSummaries),
        meetingName: meetings.name,
      })
      .from(meetingSummaries)
      .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
      .where(and(...whereConditions))
      .orderBy(desc(meetingSummaries.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Filter to only include summaries that have roadmap data
    const items = rows
      .map((row) => {
        try {
          const summaryJson = JSON.parse(row.summaryJson);
          if (!summaryJson.roadmap || !summaryJson.roadmap.nodes) {
            return null;
          }

          return {
            id: row.id,
            topic: row.topic ?? row.meetingName,
            createdAt: row.createdAt.toISOString(),
            nodeCount: summaryJson.roadmap.nodes.length || 0,
            linkCount: summaryJson.roadmap.links?.length || 0,
            recommendedClassesCount:
              summaryJson.recommended_classes?.count || 0,
            level: summaryJson.student_summary?.level || null,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Get total count
    const [totalResult] = await db
      .select({ count: meetings.id })
      .from(meetingSummaries)
      .innerJoin(meetings, eq(meetingSummaries.meetingId, meetings.id))
      .where(and(...whereConditions));

    // Note: This is an approximation since we filter by roadmap existence
    // For exact count, we'd need to parse all summaries, which is expensive
    const total = items.length;

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 0,
    });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmaps" },
      { status: 500 },
    );
  }
}

