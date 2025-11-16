import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { classSessions, courseEnrollments, agents, meetings, user as userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createAgentForUser } from '@/modules/agents/server/procedure';
import { streamVideo } from '@/lib/stream-video';
import { generateAvatarUri } from '@/lib/avatar';

export async function POST(req: NextRequest, { params }: { params: { classSessionId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const classSessionId = params.classSessionId;

    const [cls] = await db.select().from(classSessions).where(eq(classSessions.id, classSessionId));
    if (!cls) return NextResponse.json({ error: 'Class session not found' }, { status: 404 });

    const [enrollment] = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, cls.enrollmentId));
    if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });

    if (enrollment.userId !== session.user.id) return new NextResponse('Forbidden', { status: 403 });

    // Load user profile to customize agent prompt
    const [userRow] = await db.select().from(userTable).where(eq(userTable.id, session.user.id));

    // Build agent name & instructions (simple template)
    const agentName = `${enrollment.topic.split(' ')[0] || 'Tutor'} - ${cls.title}`.slice(0, 80);
    const userName = userRow?.name ?? 'Learner';
    const instructions = `You are an expert, friendly AI tutor for the topic "${enrollment.topic}". This session is titled "${cls.title}". The student is ${userName}. Adapt explanations to their pace and ask interactive questions.`;

    // Create agent
    const agent = await createAgentForUser(session.user.id, {
      name: agentName,
      instructions,
    });

    // Create meeting row and underlying stream/video call
    const [createdMeeting] = await db.insert(meetings).values({
      id: undefined as any,
      name: `Class ${cls.sessionIndex}: ${cls.title} - ${enrollment.topic}`,
      userId: session.user.id,
      agentId: agent.id,
      status: 'upcoming',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const call = streamVideo.video.call('default', createdMeeting.id);
    await call.create({
      data: {
        created_by_id: session.user.id,
        custom: { meetingId: createdMeeting.id, meetingName: createdMeeting.name },
        settings_override: {
          transcription: { language: 'en', mode: 'auto-on', closed_caption_mode: 'auto-on' },
          recording: { mode: 'auto-on', quality: '1080p' },
        },
      },
    });

    // Upsert agent user into stream for joining
    await streamVideo.upsertUsers([{ id: agent.id, name: agent.name, role: 'user', image: generateAvatarUri({ seed: agent.id, variant: 'botttsNeutral' }) }]);

    // Optionally link the meeting id back to the class session (we can store meeting id in classSessions if needed)
    await db.update(classSessions).set({ googleCalendarEventId: cls.googleCalendarEventId ?? null }).where(eq(classSessions.id, cls.id));

    // Return join target (internal route)
    const join_url = `/call/${createdMeeting.id}`;

    return NextResponse.json({ meeting_id: createdMeeting.id, join_url });
  } catch (err) {
    console.error('POST /api/classes/[id]/start error', err);
    return NextResponse.json({ error: 'Failed to start class' }, { status: 500 });
  }
}
