/**
 * Lưu trữ phản hồi Yes/No từ Slack.
 * Hiện dùng in-memory. Để deploy production (Vercel), nên dùng Vercel KV
 * hoặc database.
 */

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

const responses: SlackResponse[] = [];

export function addResponse(response: Omit<SlackResponse, 'id' | 'respondedAt'>) {
  const item: SlackResponse = {
    ...response,
    id: `${response.messageTs}-${response.userId}`,
    respondedAt: new Date().toISOString(),
  };
  const existing = responses.findIndex((r) => r.id === item.id);
  if (existing >= 0) {
    responses[existing] = item;
  } else {
    responses.push(item);
  }
  return item;
}

export function getResponses(): SlackResponse[] {
  return [...responses].sort(
    (a, b) =>
      new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime()
  );
}
