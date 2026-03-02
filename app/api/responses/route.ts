import { NextResponse } from 'next/server';
import { getResponses } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const responses = await getResponses();
  return NextResponse.json(responses);
}
