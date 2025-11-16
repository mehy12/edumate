import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { courseEnrollments, classSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSessionPlan, estimateClassesForTopic } from '@/lib/enroll';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const { topic, learningSpeed } = body;
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const estimatedClassCount = estimateClassesForTopic(topic, learningSpeed);

    const enrollmentId = randomUUID();

    await db.insert(courseEnrollments).values({
      id: enrollmentId,
      userId: session.user.id,
      topic,
      estimatedClassCount: String(estimatedClassCount),
      learningSpeed: learningSpeed ?? 'normal',
    });

    const sessions = generateSessionPlan(topic, estimatedClassCount);

    for (let i = 0; i < sessions.length; i++) {
      await db.insert(classSessions).values({
        id: randomUUID(),
        enrollmentId,
        sessionIndex: String(i),
        title: sessions[i].title,
        description: sessions[i].description ?? null,
      });
    }

    return NextResponse.json({ success: true, enrollmentId, estimatedClassCount });
  } catch (err) {
    console.error('POST /api/enroll error', err);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
