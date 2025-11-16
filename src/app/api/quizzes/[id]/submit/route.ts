import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizzes, quizAttempts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string(),
    }),
  ),
});

export async function POST(
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
    const body = await req.json();
    const { answers } = submitQuizSchema.parse(body);

    // Get quiz
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
    const questions = questionsJson.questions || [];

    // Grade answers
    const detailedResults = questions.map((q: any) => {
      const userAnswer = answers.find((a) => a.questionId === q.id);
      const userAnswerText = userAnswer?.answer?.trim() || "";

      let isCorrect = false;
      if (q.type === "mcq" || q.type === "true_false") {
        isCorrect =
          userAnswerText.toLowerCase() ===
          q.correct_answer.toLowerCase();
      } else if (q.type === "short_answer") {
        // For short answers, do fuzzy matching
        const correctLower = q.correct_answer.toLowerCase();
        const userLower = userAnswerText.toLowerCase();
        isCorrect =
          userLower === correctLower ||
          userLower.includes(correctLower) ||
          correctLower.includes(userLower);
      }

      return {
        id: q.id,
        question: q.question,
        userAnswer: userAnswerText,
        correctAnswer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const correctCount = detailedResults.filter((r: any) => r.isCorrect).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    // Save attempt
    await db.insert(quizAttempts).values({
      quizId: id,
      userId: session.user.id,
      score: score.toString(),
      answersJson: JSON.stringify({
        questions: detailedResults,
      }),
      createdAt: new Date(),
    });

    return NextResponse.json({
      score,
      correctCount,
      total,
      detailed: {
        questions: detailedResults,
      },
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 },
    );
  }
}

