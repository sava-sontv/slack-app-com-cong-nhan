# Slack Message App

Ứng dụng gửi tin nhắn tới Slack với 2 nút **Yes** và **No**, nhận phản hồi trực tiếp trong Slack.

## Tính năng

- Gửi tin nhắn tới Slack kèm 2 nút Yes/No
- Nhận phản hồi khi người dùng bấm Yes hoặc No
- Cập nhật tin nhắn trong Slack với lựa chọn của người dùng
- Deploy trên Vercel

## Cài đặt Slack App

### 1. Tạo Slack App

1. Truy cập [Slack API](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Đặt tên app và chọn workspace

### 2. Cấu hình OAuth & Permissions

1. Vào **OAuth & Permissions**
2. Thêm **Bot Token Scopes**:
   - `chat:write` - Gửi tin nhắn
   - `chat:write.public` - Gửi tin nhắn vào public channel mà bot chưa join
3. **Install to Workspace** và copy **Bot User OAuth Token** (bắt đầu bằng `xoxb-`)

### 3. Bật Interactivity

1. Vào **Interactivity & Shortcuts**
2. Bật **Interactivity**
3. **Request URL**: `https://<your-vercel-domain>/api/slack-interactions`
   - Ví dụ: `https://slack-app-xxx.vercel.app/api/slack-interactions`
4. Lưu thay đổi

### 4. Lấy Signing Secret

1. Vào **Basic Information**
2. Trong **App Credentials**, copy **Signing Secret**

## Biến môi trường

Tạo file `.env.local` (local) hoặc cấu hình trên Vercel:

| Biến | Mô tả |
|------|-------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (xoxb-...) |
| `SLACK_SIGNING_SECRET` | Signing Secret từ Basic Information |
| `SLACK_CHANNEL` | Channel mặc định (ví dụ: #general) |

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Deploy lên Vercel

1. Push code lên GitHub
2. Truy cập [vercel.com](https://vercel.com) → Import project
3. Thêm biến môi trường: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_CHANNEL`
4. Deploy

**Quan trọng**: Sau khi deploy, cập nhật **Request URL** trong Slack App (Interactivity) thành URL thực của bạn.

## Cách sử dụng

1. Mở ứng dụng (local hoặc Vercel)
2. Nhập tin nhắn (mặc định: "Bạn có đồng ý không?")
3. Nhập channel (tùy chọn, mặc định dùng SLACK_CHANNEL)
4. Bấm **Gửi tới Slack**
5. Tin nhắn xuất hiện trong Slack với 2 nút Yes/No
6. Khi ai bấm Yes hoặc No, tin nhắn được cập nhật với lựa chọn của họ
