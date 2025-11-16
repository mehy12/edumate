import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizzes, quizAttempts } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get all quizzes for user
    const userQuizzes = await db
      .select({
        id: quizzes.id,
        topic: quizzes.topic,
        difficulty: quizzes.difficulty,
        sourceType: quizzes.sourceType,
        createdAt: quizzes.createdAt,
      })
      .from(quizzes)
      .where(eq(quizzes.userId, session.user.id))
      .orderBy(desc(quizzes.createdAt));

    // Get attempt stats for each quiz
    const quizzesWithStats = await Promise.all(
      userQuizzes.map(async (quiz) => {
        const attempts = await db
          .select({
            score: quizAttempts.score,
            createdAt: quizAttempts.createdAt,
          })
          .from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.quizId, quiz.id),
              eq(quizAttempts.userId, session.user.id),
            ),
          )
          .orderBy(desc(quizAttempts.createdAt));

        const attemptCount = attempts.length;
        const lastScore =
          attempts.length > 0 ? parseFloat(attempts[0].score) : null;

        return {
          id: quiz.id,
          topic: quiz.topic,
          difficulty: quiz.difficulty,
          sourceType: quiz.sourceType,
          createdAt: quiz.createdAt.toISOString(),
          lastScore,
          attemptCount,
        };
      }),
    );

    return NextResponse.json(quizzesWithStats);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 },
    );
  }
}

