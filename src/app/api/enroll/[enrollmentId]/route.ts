import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { courseEnrollments, classSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: { enrollmentId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const enrollment = await db.select().from(courseEnrollments).where(eq(courseEnrollments.id, params.enrollmentId)).limit(1);
    if (!enrollment || enrollment.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sessions = await db.select().from(classSessions).where(eq(classSessions.enrollmentId, params.enrollmentId));

    return NextResponse.json({ enrollment: enrollment[0], sessions });
  } catch (err) {
    console.error('GET /api/enroll/[id] error', err);
    return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
  }
}
