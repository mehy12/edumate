import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const [row] = await db.select({
      id: user.id,
      name: user.name,
      image: user.image,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      collegeName: user.collegeName,
      branch: user.branch,
      yearOfStudy: user.yearOfStudy,
    }).from(user).where(eq(user.id, session.user.id));

    if (!row) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatarUrl ?? row.image ?? null,
      bio: row.bio ?? null,
      collegeName: row.collegeName ?? null,
      branch: row.branch ?? null,
      yearOfStudy: row.yearOfStudy ?? null,
    });
  } catch (error) {
    console.error("GET /api/profile error", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const body = await req.json();
    const { name, avatarUrl, bio } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (bio && typeof bio === "string" && bio.length > 300) {
      return NextResponse.json({ error: "Bio too long" }, { status: 400 });
    }
    if (avatarUrl && typeof avatarUrl === "string") {
      try {
        new URL(avatarUrl);
      } catch (e) {
        return NextResponse.json({ error: "Invalid avatarUrl" }, { status: 400 });
      }
    }

    await db.update(user).set({ name, avatarUrl: avatarUrl ?? null, bio: bio ?? null }).where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/profile error", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
