import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { classSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, { params }: { params: { enrollmentId: string } }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const { dates } = body; // expected [{ sessionIndex: number, date: string }]
    if (!Array.isArray(dates)) return NextResponse.json({ error: 'dates array required' }, { status: 400 });

    for (const d of dates) {
      if (typeof d.sessionIndex !== 'number' || !d.date) continue;
      const parsed = new Date(d.date);
      if (isNaN(parsed.getTime())) continue;

      await db.update(classSessions).set({ scheduledAt: parsed }).where(
        and(
          eq(classSessions.enrollmentId, params.enrollmentId),
          eq(classSessions.sessionIndex, String(d.sessionIndex)),
        ),
      );
    }

    const updated = await db.select().from(classSessions).where(eq(classSessions.enrollmentId, params.enrollmentId));
    return NextResponse.json({ success: true, sessions: updated });
  } catch (err) {
    console.error('POST /api/enroll/[id]/schedule error', err);
    return NextResponse.json({ error: 'Failed to schedule' }, { status: 500 });
  }
}
