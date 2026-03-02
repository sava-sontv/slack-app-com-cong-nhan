import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Slack Message App',
  description: 'Send messages to Slack with Yes/No buttons',
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
