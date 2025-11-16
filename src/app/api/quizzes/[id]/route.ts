import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizzes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
    const [quiz] = await db
      .select()
      .from(quizzes)
      .where(
        and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)),
      )
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questionsJson = JSON.parse(quiz.questionsJson);

    return NextResponse.json({
      id: quiz.id,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      sourceType: quiz.sourceType,
      createdAt: quiz.createdAt.toISOString(),
      ...questionsJson,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 },
    );
  }
}

