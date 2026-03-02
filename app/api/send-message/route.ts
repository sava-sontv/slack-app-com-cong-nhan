import { NextRequest, NextResponse } from 'next/server';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#hello-world';

type SlackBlock = {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{
    type: string;
    text?: string | { type: string; text: string; emoji?: boolean };
    action_id?: string;
    value?: string;
    style?: string;
  }>;
};

const TITLE_ICON = ':fork_and_knife:';

function buildMessageBlocks(message: string): SlackBlock[] {
  const title = message.trim() || 'SAVA - Cơm Công Nhân?';
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${TITLE_ICON} ${title}`, emoji: true },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '👇 Chọn *Có* hoặc *Không* bên dưới để phản hồi',
        },
      ] as SlackBlock['elements'],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: '✅ Có', emoji: true },
          action_id: 'yes_button',
          value: 'yes',
          style: 'primary',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '❌ Không', emoji: true },
          action_id: 'no_button',
          value: 'no',
        },
      ],
    },
  ];
}

export async function POST(request: NextRequest) {
  if (!SLACK_BOT_TOKEN) {
    return NextResponse.json(
      { error: 'SLACK_BOT_TOKEN is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const message = body.message || 'SAVA - Cơm Công Nhân?';
    const rawChannel = (body.channel || SLACK_CHANNEL || '').trim();
    const channel = rawChannel.startsWith('#')
      ? rawChannel.slice(1)
      : rawChannel;

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel,
        text: message,
        blocks: buildMessageBlocks(message),
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      const slackError = data.error || 'Failed to send message';
      const hint =
        slackError === 'channel_not_found'
          ? ' (Thử dùng Channel ID thay vì tên, hoặc mời bot vào channel)'
          : '';
      return NextResponse.json(
        { error: `${slackError}${hint}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: data.channel,
      ts: data.ts,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
