'use client';

import { useState } from 'react';

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

export default function HomePage() {
  const [message, setMessage] = useState('Bạn có đồng ý không?');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const listChannel = [
    {
      value: '#hello-world',
      label: '#hello-world',
    },
  ];
  const [channel, setChannel] = useState(listChannel[0].value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim() || 'Bạn có đồng ý không?',
          channel: channel.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gửi thất bại');
      }

      setStatus('success');
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
          Gửi tin nhắn với nút Yes/No tới Slack
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
            placeholder="Bạn có đồng ý không?"
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
            Channel (tùy chọn, mặc định: #general)
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
            {listChannel.map((channel) => (
              <option key={channel.value} value={channel.value}>
                {channel.label}
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
      </div>
    </main>
  );
}
