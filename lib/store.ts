/**
 * Lưu trữ phản hồi Yes/No từ Slack.
 * Dùng Vercel Neon (Postgres) để persist dữ liệu.
 */

import { neon } from '@neondatabase/serverless';

export type SlackResponse = {
  id: string;
  userId: string;
  userName: string;
  channelId: string;
  channelName: string;
  messageTs: string;
  choice: 'yes' | 'no';
  respondedAt: string;
};

function getConnectionString(): string {
  const url = process.env.POSTGRES_URL;
  if (url) {
    return url;
  }
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST;
  const database = process.env.POSTGRES_DATABASE ?? 'neondb';
  if (!user || !password || !host) {
    throw new Error(
      'Missing Postgres config: set POSTGRES_URL or POSTGRES_USER, ' +
      'POSTGRES_PASSWORD, POSTGRES_HOST (and optionally POSTGRES_DATABASE)'
    );
  }
  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  return `postgresql://${encodedUser}:${encodedPassword}@${host}/${database}?sslmode=require`;
}

function getSql() {
  return neon(getConnectionString());
}

/**
 * Thêm hoặc ghi đè câu trả lời. Cùng user + cùng message_ts = một bản ghi.
 * Nếu user đổi từ Yes sang No (hoặc ngược lại), bản ghi cũ được cập nhật.
 */
export async function addResponse(
  response: Omit<SlackResponse, 'id' | 'respondedAt'>
): Promise<SlackResponse> {
  const id = `${response.messageTs}-${response.userId}`;
  const respondedAt = new Date().toISOString();
  const sql = getSql();
  await sql`
    INSERT INTO slack_responses (
      id, user_id, user_name, channel_id, channel_name,
      message_ts, choice, responded_at
    )
    VALUES (
      ${id}, ${response.userId}, ${response.userName},
      ${response.channelId}, ${response.channelName},
      ${response.messageTs}, ${response.choice}, ${respondedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      user_name = EXCLUDED.user_name,
      channel_name = EXCLUDED.channel_name,
      choice = EXCLUDED.choice,
      responded_at = EXCLUDED.responded_at
  `;
  return {
    ...response,
    id,
    respondedAt,
  };
}

type SlackResponseRow = {
  id: string;
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  message_ts: string;
  choice: 'yes' | 'no';
  responded_at: string;
};

function rowToResponse(row: SlackResponseRow): SlackResponse {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    channelId: row.channel_id,
    channelName: row.channel_name,
    messageTs: row.message_ts,
    choice: row.choice,
    respondedAt: row.responded_at,
  };
}

function getStartOfTodayUtc(): string {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return start.toISOString();
}

export async function getResponses(): Promise<SlackResponse[]> {
  const sql = getSql();
  const startOfToday = getStartOfTodayUtc();
  const rows = await sql`
    SELECT id, user_id, user_name, channel_id, channel_name,
           message_ts, choice, responded_at::text AS responded_at
    FROM slack_responses
    WHERE responded_at >= ${startOfToday}
    ORDER BY responded_at DESC
  `;
  return (rows as SlackResponseRow[]).map(rowToResponse);
}

/**
 * Lấy tất cả phản hồi theo message_ts (một tin nhắn cụ thể).
 * Dùng để hiển thị danh sách user theo nhóm Yes/No trên Slack.
 */
export async function getResponsesByMessageTs(
  messageTs: string
): Promise<SlackResponse[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, user_id, user_name, channel_id, channel_name,
           message_ts, choice, responded_at::text AS responded_at
    FROM slack_responses
    WHERE message_ts = ${messageTs}
    ORDER BY choice, responded_at
  `;
  return (rows as SlackResponseRow[]).map(rowToResponse);
}
