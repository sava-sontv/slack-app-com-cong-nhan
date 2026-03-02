'use client';

import { useState, useEffect, useCallback } from 'react';

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

type SlackResponse = {
  id: string;
  userId: string;
  userName: string;
  channelId: string;
  channelName: string;
  messageTs: string;
  choice: 'yes' | 'no';
  respondedAt: string;
};

const defaultQuestion = 'SAVA - Cơm Công Nhân?';
// const defaultChannel = '#lên-tỉnh';
const defaultChannel = '#hello-world';

export default function HomePage() {
  const [message, setMessage] = useState(defaultQuestion);
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [responses, setResponses] = useState<SlackResponse[]>([]);
  const listChannel = [
    {
      value: '#lên-tỉnh',
      label: '#lên-tỉnh',
    },
    {
      value: '#hello-world',
      label: '#hello-world',
    },
  ];
  const [channel, setChannel] = useState(defaultChannel);

  const fetchResponses = useCallback(async () => {
    try {
      const res = await fetch('/api/responses');
      if (res.ok) {
        const data = await res.json();
        setResponses(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim() || defaultQuestion,
          channel: channel.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gửi thất bại');
      }

      setStatus('success');
      fetchResponses();
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h1
          style={{
            color: '#fff',
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            fontWeight: 600,
          }}
        >
          Slack Message
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
          }}
        >
          Gửi tin nhắn với nút Có/Không tới Slack
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.85rem',
              marginBottom: '0.4rem',
            }}
          >
            Tin nhắn
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={defaultQuestion}
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '0.95rem',
              marginBottom: '1rem',
              resize: 'vertical',
            }}
          />

          <label
            style={{
              display: 'block',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '0.85rem',
              marginBottom: '0.4rem',
            }}
          >
            Channel (tùy chọn, mặc định: {defaultChannel})
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.2)',
              color: '#fff',
              fontSize: '0.95rem',
              marginBottom: '1.25rem',
            }}
          >
            {listChannel.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {ch.label}
              </option>
            ))}
          </select>

          {status === 'success' && (
            <p
              style={{
                color: '#4ade80',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              Đã gửi thành công!
            </p>
          )}
          {status === 'error' && (
            <p
              style={{
                color: '#f87171',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              border: 'none',
              background: status === 'loading'
                ? 'rgba(74,222,128,0.5)'
                : 'linear-gradient(90deg, #4ade80, #22c55e)',
              color: '#0f172a',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            }}
          >
            {status === 'loading' ? 'Đang gửi...' : 'Gửi tới Slack'}
          </button>
        </form>

        {responses.length > 0 && (() => {
          const latestByUser = new Map<string, SlackResponse>();
          for (const r of responses) {
            const existing = latestByUser.get(r.userId);
            if (
              !existing ||
              new Date(r.respondedAt) > new Date(existing.respondedAt)
            ) {
              latestByUser.set(r.userId, r);
            }
          }
          const allLatest = Array.from(latestByUser.values());
          const yesList = allLatest
            .filter((r) => r.choice === 'yes')
            .sort((a, b) => a.userName.localeCompare(b.userName));
          const noList = allLatest
            .filter((r) => r.choice === 'no')
            .sort((a, b) => a.userName.localeCompare(b.userName));
          return (
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <h2
                  style={{
                    color: '#fff',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Phản hồi từ Channel
                </h2>
                <button
                  type="button"
                  onClick={fetchResponses}
                  style={{
                    padding: '0.35rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Làm mới
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(74,222,128,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    border: '1px solid rgba(74,222,128,0.3)',
                  }}
                >
                  <div
                    style={{
                      color: '#4ade80',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Yes ({yesList.length})
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.85rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {yesList.map((r) => (
                      <li key={r.userId} style={{ padding: '0.2rem 0' }}>
                        {r.userName}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  style={{
                    background: 'rgba(248,113,113,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    border: '1px solid rgba(248,113,113,0.3)',
                  }}
                >
                  <div
                    style={{
                      color: '#f87171',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    No ({noList.length})
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '0.85rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    }}
                  >
                    {noList.map((r) => (
                      <li key={r.userId} style={{ padding: '0.2rem 0' }}>
                        {r.userName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
