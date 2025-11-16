import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quizzes, meetingSummaries, meetings } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { createAgent, gemini, TextMessage } from "@inngest/agent-kit";

const generateQuizSchema = z.object({
  sourceType: z.enum(["meeting", "course", "manual"]),
  sourceId: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const quizGeneratorAgent = createAgent({
  name: "quiz-generator",
  system: `You are an AI tutor creating educational quizzes based on learning session summaries.

Given a topic, session summary, student level, and learning speed, generate a quiz with 5-10 questions.

Focus on:
- Key concepts discussed in the session
- Areas the student struggled with (from weaknesses)
- Important learning points from the call summary

Generate questions in this exact JSON format:

{
  "title": "Quiz: [Topic] ([Difficulty])",
  "description": "Short description of what this quiz covers.",
  "difficulty": "easy" | "medium" | "hard",
  "questions": [
    {
      "id": "q1",
      "question": "Question text here",
      "type": "mcq" | "true_false" | "short_answer",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],  // only for mcq
      "correct_answer": "The correct answer",
      "explanation": "Why this answer is correct and what it teaches"
    }
  ]
}

Rules:
- For MCQ: Always provide exactly 4 options
- For true_false: correct_answer should be "True" or "False"
- For short_answer: Accept reasonable variations, but provide a clear correct_answer
- Include explanations that help the student learn
- Match difficulty level to student's level
- Only output valid JSON, no other text
`.trim(),
  model: gemini({
    model: "gemini-2.0-flash",
    apiKey: GEMINI_API_KEY,
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { sourceType, sourceId, difficulty } = generateQuizSchema.parse(body);

    let summaryData: {
      topic: string | null;
      summaryJson: any;
      studentLevel?: string;
      learningSpeed?: string;
      weaknesses?: string[];
      callSummary?: string;
    } | null = null;

    if (sourceType === "meeting") {
      if (sourceId) {
        // Get specific meeting summary
        const [summary] = await db
          .select({
            topic: meetingSummaries.topic,
            summaryJson: meetingSummaries.summaryJson,
          })
          .from(meetingSummaries)
          .where(
            and(
              eq(meetingSummaries.meetingId, sourceId),
              eq(meetingSummaries.userId, session.user.id),
            ),
          )
          .limit(1);

        if (!summary) {
          return NextResponse.json(
            { error: "Meeting summary not found" },
            { status: 404 },
          );
        }

        const parsed = JSON.parse(summary.summaryJson);
        summaryData = {
          topic: summary.topic,
          summaryJson: parsed,
          studentLevel: parsed.student_summary?.level,
          learningSpeed: parsed.student_summary?.fast_or_slow_learner,
          weaknesses: parsed.student_summary?.weaknesses,
          callSummary: parsed.student_summary?.call_summary,
        };
      } else {
        // Get most recent meeting summaries (1-3)
        const recentSummaries = await db
          .select({
            topic: meetingSummaries.topic,
            summaryJson: meetingSummaries.summaryJson,
          })
          .from(meetingSummaries)
          .where(eq(meetingSummaries.userId, session.user.id))
          .orderBy(desc(meetingSummaries.createdAt))
          .limit(3);

        if (recentSummaries.length === 0) {
          return NextResponse.json(
            { error: "No meeting summaries found" },
            { status: 404 },
          );
        }

        // Use the most recent one, or combine them
        const latest = recentSummaries[0];
        const parsed = JSON.parse(latest.summaryJson);
        summaryData = {
          topic: latest.topic,
          summaryJson: parsed,
          studentLevel: parsed.student_summary?.level,
          learningSpeed: parsed.student_summary?.fast_or_slow_learner,
          weaknesses: parsed.student_summary?.weaknesses,
          callSummary: parsed.student_summary?.call_summary,
        };
      }
    } else {
      return NextResponse.json(
        { error: "Only 'meeting' source type is currently supported" },
        { status: 400 },
      );
    }

    if (!summaryData) {
      return NextResponse.json(
        { error: "Failed to load summary data" },
        { status: 500 },
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Server LLM configuration is missing" },
        { status: 500 },
      );
    }

    // Build prompt for quiz generation
    const prompt = `Topic: ${summaryData.topic || "Unknown"}

Student Level: ${summaryData.studentLevel || "intermediate"}
Learning Speed: ${summaryData.learningSpeed || "medium"}
Difficulty: ${difficulty}

Session Summary:
${summaryData.callSummary || "No summary available"}

Student Weaknesses:
${summaryData.weaknesses?.join(", ") || "None identified"}

Generate a quiz with 5-10 questions focusing on the key concepts from this session and areas where the student needs improvement.`;

    let content: string;
    try {
      const { output } = await quizGeneratorAgent.run(prompt);
      const first = output[0] as TextMessage;
      content = String(first.content ?? "");
    } catch (err) {
      console.error("Error calling quiz generator agent", err);
      return NextResponse.json(
        { error: "Failed to generate quiz" },
        { status: 500 },
      );
    }

    // Parse and validate quiz JSON
    let quizJson: any;
    try {
      // Try to extract JSON from response (might have markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizJson = JSON.parse(jsonMatch[0]);
      } else {
        quizJson = JSON.parse(content);
      }

      // Validate structure
      if (!quizJson.title || !quizJson.questions || !Array.isArray(quizJson.questions)) {
        throw new Error("Invalid quiz structure");
      }
    } catch (err) {
      console.error("Error parsing quiz JSON", err);
      return NextResponse.json(
        { error: "Failed to parse generated quiz" },
        { status: 500 },
      );
    }

    // Set difficulty if not provided
    quizJson.difficulty = difficulty;

    // Save quiz to database
    const [newQuiz] = await db
      .insert(quizzes)
      .values({
        userId: session.user.id,
        sourceType,
        sourceId: sourceId || null,
        topic: summaryData.topic || "Unknown Topic",
        difficulty,
        questionsJson: JSON.stringify(quizJson),
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        quizId: newQuiz.id,
        quiz: quizJson,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error generating quiz:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 },
    );
  }
}

