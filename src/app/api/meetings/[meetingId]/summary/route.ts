import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { meetings, meetingSummaries } from "@/db/schema";
import JSONL from "jsonl-parse-stringify";
import { and, eq } from "drizzle-orm";
import { createAgent, gemini, TextMessage } from "@inngest/agent-kit";
import type { StreamTranscriptItem } from "@/modules/meetings/types";

// Zod schema describing the JSON structure we expect from the LLM
const meetingSummaryJsonSchema = z.object({
  student_summary: z.object({
    level: z.string(),
    fast_or_slow_learner: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    call_summary: z.string(),
  }),
  recommended_classes: z.object({
    count: z.number(),
    classes: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
  roadmap: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
      }),
    ),
    links: z.array(
      z.object({
        from: z.string(),
        to: z.string(),
      }),
    ),
  }),
  resources: z.object({
    websites: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string(),
      }),
    ),
    books: z.array(
      z.object({
        title: z.string(),
        author: z.string().optional(),
        purchase_url: z.string(),
      }),
    ),
  }),
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const meetingSummaryAgent = createAgent({
  name: "meeting-learning-summary",
  system: `You are an AI tutor analyzing a transcript of a learning session between a student and an AI tutor.

Given the full transcript and the (optional) topic, infer:
- Student's current level (beginner / intermediate / advanced).
- Whether they are a fast, medium, or slow learner.
- Key strengths (what they already know or picked up quickly).
- Key weaknesses (what they struggled with, misconceptions, or gaps).
- A short summary paragraph of what was discussed and learned.
- A recommended number of additional classes (integer between 3 and 10) adapted to their learning speed.
- A list of future classes with title and short description.
- A roadmap graph: nodes (id, label, type - either "concept" or "class") and directed links between nodes.
- Top 3 recommended websites/articles.
- Top 3 recommended books for further learning.

Respond with a single JSON object exactly matching this TypeScript structure:

{
  "student_summary": {
    "level": "beginner" | "intermediate" | "advanced",
    "fast_or_slow_learner": "fast" | "medium" | "slow",
    "strengths": string[],
    "weaknesses": string[],
    "call_summary": string
  },
  "recommended_classes": {
    "count": number,
    "classes": {
      "title": string,
      "description": string
    }[]
  },
  "roadmap": {
    "nodes": {
      "id": string,
      "label": string,
      "type": "concept" | "class"
    }[],
    "links": {
      "from": string,
      "to": string
    }[]
  },
  "resources": {
    "websites": {
      "title": string,
      "description": string,
      "url": string
    }[],
    "books": {
      "title": string,
      "author": string,
      "purchase_url": string
    }[]
  }
}

CRITICAL:
- Only output JSON, with no explanation text.
- Ensure the JSON is syntactically valid and can be parsed directly.
`.trim(),
  model: gemini({
    model: "gemini-2.0-flash",
    // Intentionally left nullable so environments without the key fail fast when used
    apiKey: GEMINI_API_KEY ?? "",
  }),
});

function extractTopicFromMeetingName(name: string): string | null {
  const prefix = "Learning session - ";
  if (name.startsWith(prefix)) {
    const topic = name.slice(prefix.length).trim();
    return topic.length > 0 ? topic : null;
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { meetingId: string } },
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const meetingId = params.meetingId;

  const [existingMeeting] = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, meetingId), eq(meetings.userId, session.user.id)));

  if (!existingMeeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // If we already have a stored summary, return it directly
  const [existingSummary] = await db
    .select()
    .from(meetingSummaries)
    .where(eq(meetingSummaries.meetingId, existingMeeting.id));

  if (existingSummary) {
    try {
      const json = JSON.parse(existingSummary.summaryJson);
      return NextResponse.json(json);
    } catch (err) {
      console.error("Stored meeting summary is not valid JSON", err);
      return NextResponse.json(
        { error: "Stored meeting summary is invalid" },
        { status: 500 },
      );
    }
  }

  if (!existingMeeting.transcriptUrl) {
    return NextResponse.json(
      { error: "Transcript not available yet" },
      { status: 409 },
    );
  }

  let transcriptRaw: string;
  try {
    const res = await fetch(existingMeeting.transcriptUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch transcript" },
        { status: 502 },
      );
    }
    transcriptRaw = await res.text();
  } catch (err) {
    console.error("Error fetching transcript", err);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 502 },
    );
  }

  let transcript: StreamTranscriptItem[];
  try {
    transcript = JSONL.parse<StreamTranscriptItem>(transcriptRaw);
  } catch (err) {
    console.error("Error parsing transcript JSONL", err);
    return NextResponse.json(
      { error: "Failed to parse transcript" },
      { status: 500 },
    );
  }

  if (!transcript.length) {
    return NextResponse.json(
      { error: "Transcript is empty" },
      { status: 422 },
    );
  }

  const topic = extractTopicFromMeetingName(existingMeeting.name);

  // Build a compact text transcript suitable for prompting the LLM
  const transcriptForPrompt = transcript
    .map((item) => {
      const role =
        item.speaker_id === existingMeeting.userId
          ? "student"
          : item.speaker_id === existingMeeting.agentId
          ? "tutor"
          : "other";
      return `${role.toUpperCase()}: ${item.text}`;
    })
    .join("\n");

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return NextResponse.json(
      { error: "Server LLM configuration is missing" },
      { status: 500 },
    );
  }

  let content: string;
  try {
    const { output } = await meetingSummaryAgent.run(
      `Topic: ${topic ?? "Unknown"}\n\nTranscript:\n${transcriptForPrompt}`,
    );

    const first = output[0] as TextMessage;
    content = String(first.content ?? "");
  } catch (err) {
    console.error("Error calling meeting summary agent", err);
    return NextResponse.json(
      { error: "Failed to generate meeting summary" },
      { status: 500 },
    );
  }

  let parsed;
  try {
    const json = JSON.parse(content);
    parsed = meetingSummaryJsonSchema.parse(json);
  } catch (err) {
    console.error("LLM output was not valid JSON", err);
    return NextResponse.json(
      { error: "LLM output was not valid JSON" },
      { status: 500 },
    );
  }

  try {
    await db.insert(meetingSummaries).values({
      meetingId: existingMeeting.id,
      userId: session.user.id,
      topic: topic ?? null,
      summaryJson: JSON.stringify(parsed),
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to persist meeting summary", err);
    return NextResponse.json(
      { error: "Failed to save meeting summary" },
      { status: 500 },
    );
  }

  return NextResponse.json(parsed);
}
