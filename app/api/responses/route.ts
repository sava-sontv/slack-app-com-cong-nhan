import { NextResponse } from 'next/server';
import { getResponses } from '@/lib/store';

export async function GET() {
  const responses = getResponses();
  return NextResponse.json(responses);
}
