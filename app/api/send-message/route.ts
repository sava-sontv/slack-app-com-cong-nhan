import { NextRequest, NextResponse } from 'next/server';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#hello-world';

type SlackBlock = {
  type: string;
  text?: { type: string; text: string };
  elements?: Array<{
    type: string;
    text?: { type: string; text: string };
    action_id?: string;
    value?: string;
    style?: string;
  }>;
};

const TITLE_ICON = ':fork_and_knife:';

function buildMessageBlocks(message: string): SlackBlock[] {
  const titleText = `${TITLE_ICON} ${message}`;
  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: titleText },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Có' },
          action_id: 'yes_button',
          value: 'yes',
          style: 'primary',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Không' },
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
    const channel = body.channel || SLACK_CHANNEL;

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
      return NextResponse.json(
        { error: data.error || 'Failed to send message' },
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
