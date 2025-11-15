import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";

const onboardingSchema = z.object({
  collegeName: z.string().min(1, "College name is required"),
  yearOfStudy: z.union([z.string(), z.number()]),
  branch: z.string().min(1, "Branch is required"),
  interests: z.array(z.string()).min(5, "Select at least 5 interests"),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = onboardingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { collegeName, yearOfStudy, branch, interests } = parsed.data;

  const normalizedYear = String(yearOfStudy);

  try {
    await db
      .update(user)
      .set({
        collegeName,
        yearOfStudy: normalizedYear,
        branch,
        interests: JSON.stringify(interests),
        hasCompletedOnboarding: true,
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save onboarding details", err);
    return NextResponse.json(
      { error: "Failed to save onboarding details" },
      { status: 500 }
    );
  }
}
