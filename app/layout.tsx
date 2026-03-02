import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SAVA - Cơm Công Nhân',
  description: 'Send messages to Slack with Có/Không buttons',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
