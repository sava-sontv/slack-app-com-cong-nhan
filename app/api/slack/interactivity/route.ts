import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slackVerify';
import { addResponse } from '@/lib/store';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

type BlockActionsPayload = {
  type: string;
  user?: { id: string; username?: string; name?: string };
  channel?: { id: string; name?: string };
  message?: { ts: string };
  container?: { message_ts?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
};

export async function POST(request: NextRequest) {
  if (!SLACK_SIGNING_SECRET) {
    return NextResponse.json(
      { error: 'SLACK_SIGNING_SECRET is not configured' },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-slack-signature') ?? undefined;
  const timestamp =
    request.headers.get('x-slack-request-timestamp') ?? undefined;

  if (
    !verifySlackRequest(rawBody, signature, timestamp, SLACK_SIGNING_SECRET)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: BlockActionsPayload;
  try {
    const params = new URLSearchParams(rawBody);
    const payloadStr = params.get('payload');
    if (!payloadStr) {
      return NextResponse.json(
        { error: 'Missing payload' },
        { status: 400 }
      );
    }
    payload = JSON.parse(payloadStr) as BlockActionsPayload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400 }
    );
  }

  if (payload.type !== 'block_actions') {
    return NextResponse.json({ ok: true });
  }

  const action = payload.actions?.[0];
  if (!action || !payload.user || !payload.channel) {
    return NextResponse.json({ ok: true });
  }

  const isYes = action.action_id === 'yes_button' || action.value === 'yes';
  const isNo = action.action_id === 'no_button' || action.value === 'no';
  if (!isYes && !isNo) {
    return NextResponse.json({ ok: true });
  }

  const choice = isYes ? 'yes' : 'no';
  const messageTs =
    payload.message?.ts ?? payload.container?.message_ts ?? 'unknown';

  addResponse({
    userId: payload.user.id,
    userName:
      payload.user.name ?? payload.user.username ?? payload.user.id,
    channelId: payload.channel.id,
    channelName: payload.channel.name ?? payload.channel.id,
    messageTs,
    choice,
  });

  return NextResponse.json({ ok: true });
}
