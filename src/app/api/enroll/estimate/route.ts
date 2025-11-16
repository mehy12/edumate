import { NextRequest, NextResponse } from 'next/server';
import { estimateClassesForTopic } from '@/lib/enroll';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, learningSpeed } = body;
    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const estimatedClassCount = estimateClassesForTopic(topic, learningSpeed);
    return NextResponse.json({ estimatedClassCount });
  } catch (err) {
    console.error('POST /api/enroll/estimate error', err);
    return NextResponse.json({ error: 'Failed to estimate' }, { status: 500 });
  }
}
