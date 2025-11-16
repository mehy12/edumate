import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { courseEnrollments, classSessions } from '@/db/schema';
import { and, eq, sql, asc, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const now = new Date();

    const rows = await db
      .select({
        classSessionId: classSessions.id,
        enrollmentId: classSessions.enrollmentId,
        topic: courseEnrollments.topic,
        title: classSessions.title,
        scheduledAt: classSessions.scheduledAt,
        googleCalendarEventId: classSessions.googleCalendarEventId,
        sessionIndex: classSessions.sessionIndex,
        totalClasses: courseEnrollments.estimatedClassCount,
        enrollmentStatus: courseEnrollments.status,
      })
      .from(classSessions)
      .leftJoin(courseEnrollments, eq(classSessions.enrollmentId, courseEnrollments.id))
      .where(
        and(
          eq(courseEnrollments.userId, session.user.id),
          sql`${classSessions.scheduledAt} is not null`,
          gte(classSessions.scheduledAt, now),
        ),
      )
      .orderBy(asc(classSessions.scheduledAt));

    const mapped = rows.map((r) => ({
      classSessionId: r.classSessionId,
      enrollmentId: r.enrollmentId,
      topic: r.topic,
      title: r.title,
      scheduledAt: r.scheduledAt,
      googleCalendarEventId: r.googleCalendarEventId,
      sessionIndex: Number(r.sessionIndex ?? 0),
      totalClasses: r.totalClasses ? Number(r.totalClasses) : null,
      status: r.scheduledAt && new Date(r.scheduledAt) < new Date() ? 'past' : 'upcoming',
      enrollmentStatus: r.enrollmentStatus,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error('GET /api/enroll/scheduled-classes error', err);
    return NextResponse.json({ error: 'Failed to fetch scheduled classes' }, { status: 500 });
  }
}
