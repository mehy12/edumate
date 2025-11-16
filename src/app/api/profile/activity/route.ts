import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { activityEvents } from "@/db/schema";
import { and, gte, lt, eq } from "drizzle-orm";

function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const range = url.searchParams.get("range") || "year";

  let end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  let start = new Date(end);

  if (range === "year") {
    start.setUTCDate(end.getUTCDate() - 364);
  } else {
    // default to 90 days if unknown
    start.setUTCDate(end.getUTCDate() - 89);
  }

  try {
    const rows = await db.select({ createdAt: activityEvents.createdAt }).from(activityEvents).where(and(gt(activityEvents.createdAt, new Date(0)), /* dummy to satisfy types */ activityEvents.userId.eq(session.user.id)));
    // Above query is placeholder; we'll instead run a focused query using raw SQL via db.query if available.
  } catch (err) {
    // fall through to fallback implementation
  }

  try {
    // Use a straightforward approach: fetch events for the user in range and aggregate in JS
    const events = await db.select({ createdAt: activityEvents.createdAt }).from(activityEvents).where(and(eq(activityEvents.userId, session.user.id), gte(activityEvents.createdAt, start), lt(activityEvents.createdAt, new Date(end.getTime() + 24 * 60 * 60 * 1000))));

    // create map of date->count
    const counts = new Map<string, number>();
    events.forEach((r: any) => {
      const d = startOfDay(new Date(r.createdAt));
      const key = d.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      days.push({ date: key, count: counts.get(key) || 0 });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return NextResponse.json({ startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), days });
  } catch (error) {
    console.error("GET /api/profile/activity error", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
