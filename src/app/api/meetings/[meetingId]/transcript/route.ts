import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { generateAvatarUri } from "@/lib/avatar";
import type { StreamTranscriptItem } from "@/modules/meetings/types";

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

  if (!existingMeeting.transcriptUrl) {
    return NextResponse.json([], { status: 200 });
  }

  let transcript: StreamTranscriptItem[] = [];

  try {
    const raw = await fetch(existingMeeting.transcriptUrl).then((res) => res.text());
    transcript = JSONL.parse<StreamTranscriptItem>(raw);
  } catch (err) {
    console.error("Failed to fetch or parse transcript", err);
    // Return an empty transcript instead of failing hard
    return NextResponse.json([], { status: 200 });
  }

  if (!transcript.length) {
    return NextResponse.json([], { status: 200 });
  }

  const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

  const userSpeakers = await db
    .select()
    .from(user)
    .where(inArray(user.id, speakerIds))
    .then((users) =>
      users.map((u) => ({
        id: u.id,
        name: u.name,
        image:
          u.image ??
          generateAvatarUri({
            seed: u.name,
            variant: "initials",
          }),
      })),
    );

  const agentSpeakers = await db
    .select()
    .from(agents)
    .where(inArray(agents.id, speakerIds))
    .then((agentsRows) =>
      agentsRows.map((a) => ({
        id: a.id,
        name: a.name,
        image: generateAvatarUri({
          seed: a.name,
          variant: "botttsNeutral",
        }),
      })),
    );

  const speakers = [...userSpeakers, ...agentSpeakers];

  const transcriptWithSpeakers = transcript.map((item) => {
    const speaker = speakers.find((s) => s.id === item.speaker_id);

    if (!speaker) {
      return {
        ...item,
        speaker: {
          id: item.speaker_id,
          name: "Unknown",
          image: generateAvatarUri({
            seed: "Unknown",
            variant: "initials",
          }),
        },
      };
    }

    return {
      ...item,
      speaker,
    };
  });

  return NextResponse.json(transcriptWithSpeakers, { status: 200 });
}
