import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const FIVE_MINUTES = 5 * 60;

function verifySlackRequest(
  body: string,
  signature: string | undefined,
  timestamp: string | undefined
): boolean {
  if (!SLACK_SIGNING_SECRET || !signature || !timestamp) {
    return false;
  }

  const ts = parseInt(timestamp, 10);
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > FIVE_MINUTES) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    'v0=' +
    crypto
      .createHmac('sha256', SLACK_SIGNING_SECRET)
      .update(sigBasestring)
      .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');

  if (
    SLACK_SIGNING_SECRET &&
    !verifySlackRequest(body, signature || undefined, timestamp || undefined)
  ) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const params = new URLSearchParams(body);
    const payloadStr = params.get('payload');

    if (!payloadStr) {
      return NextResponse.json(
        { error: 'Missing payload' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(payloadStr);

    if (payload.type === 'block_actions') {
      const action = payload.actions?.[0];
      const responseUrl = payload.response_url;
      const user = payload.user?.name || 'Unknown';

      const actionValue = action?.value;
      const actionId = action?.action_id;

      let responseText = '';
      if (actionId === 'yes_button' || actionValue === 'yes') {
        responseText = `:white_check_mark: ${user} đã chọn **Yes**`;
      } else if (actionId === 'no_button' || actionValue === 'no') {
        responseText = `:x: ${user} đã chọn **No**`;
      }

      if (responseUrl && responseText) {
        await fetch(responseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            replace_original: true,
            text: responseText,
            blocks: [
              {
                type: 'section',
                text: { type: 'mrkdwn', text: responseText },
              },
            ],
          }),
        });
      }
    }

    return new NextResponse();
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to process' },
      { status: 500 }
    );
  }
}
