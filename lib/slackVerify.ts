import crypto from 'crypto';

const FIVE_MINUTES = 60 * 5;

export function verifySlackRequest(
  body: string,
  signature: string | undefined,
  timestamp: string | undefined,
  signingSecret: string
): boolean {
  if (!signature || !signingSecret || !timestamp) return false;
  const ts = parseInt(timestamp, 10);
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > FIVE_MINUTES) {
    return false;
  }
  const [version, hash] = signature.split('=');
  if (version !== 'v0' || !hash) return false;
  const baseString = `v0:${timestamp}:${body}`;
  const computed = crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(computed, 'hex')
    );
  } catch {
    return false;
  }
}
