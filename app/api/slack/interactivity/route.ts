import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slackVerify';
import { addResponse, getResponsesByMessageTs } from '@/lib/store';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

type SlackBlock = {
  type: string;
  text?: { type: string; text: string };
  elements?: unknown[];
};

type BlockActionsPayload = {
  type: string;
  user?: { id: string; username?: string; name?: string };
  channel?: { id: string; name?: string };
  message?: { ts: string; text?: string; blocks?: SlackBlock[] };
  container?: { message_ts?: string };
  actions?: Array<{ action_id?: string; value?: string }>;
};

const ICON_YES = ':white_check_mark:';
const ICON_NO = ':x:';

function buildSummaryLines(responses: { userId: string; choice: string }[]) {
  const yesUsers = responses.filter((r) => r.choice === 'yes');
  const noUsers = responses.filter((r) => r.choice === 'no');
  const yesCount = yesUsers.length;
  const noCount = noUsers.length;
  const yesLine =
    yesCount > 0
      ? `${ICON_YES} *Có (${yesCount}):* ${yesUsers.map((u) => `<@${u.userId}>`).join(' ')}`
      : `${ICON_YES} *Có (0):* _chưa có_`;
  const noLine =
    noCount > 0
      ? `${ICON_NO} *Không (${noCount}):* ${noUsers.map((u) => `<@${u.userId}>`).join(' ')}`
      : `${ICON_NO} *Không (0):* _chưa có_`;
  return `${yesLine}\n${noLine}`;
}

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

  await addResponse({
    userId: payload.user.id,
    userName:
      payload.user.name ?? payload.user.username ?? payload.user.id,
    channelId: payload.channel.id,
    channelName: payload.channel.name ?? payload.channel.id,
    messageTs,
    choice,
  });

  const responses = await getResponsesByMessageTs(messageTs);
  const summaryText = buildSummaryLines(responses);

  const existingBlocks = payload.message?.blocks ?? [];
  let textBlock = existingBlocks.find(
    (b) => b.type === 'section' && b.text
  ) as SlackBlock | undefined;
  if (!textBlock && payload.message?.text) {
    textBlock = {
      type: 'section',
      text: { type: 'mrkdwn', text: payload.message.text },
    };
  }
  const actionsBlock = existingBlocks.find(
    (b) => b.type === 'actions'
  ) as SlackBlock | undefined;

  const summaryBlock: SlackBlock = {
    type: 'section',
    text: { type: 'mrkdwn', text: summaryText },
  };

  const newBlocks: SlackBlock[] = [];
  if (textBlock) {
    newBlocks.push(textBlock);
  }
  newBlocks.push(summaryBlock);
  if (actionsBlock) {
    newBlocks.push(actionsBlock);
  }

  if (SLACK_BOT_TOKEN && newBlocks.length > 0 && payload.channel) {
    await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: payload.channel.id,
        ts: messageTs,
        blocks: newBlocks,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
