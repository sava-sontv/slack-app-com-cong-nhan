import { NextResponse } from 'next/server';
import { getResponses } from '@/lib/store';

export async function GET() {
  const responses = await getResponses();
  return NextResponse.json(responses);
}
