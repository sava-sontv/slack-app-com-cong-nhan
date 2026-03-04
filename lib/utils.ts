type SlackBlock = {
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    elements?: Array<{
        type: string;
        text?: string | { type: string; text: string; emoji?: boolean };
        action_id?: string;
        value?: string;
        style?: string;
    }>;
};


const TITLE_ICON = ':fork_and_knife:';
const TITLE = 'SAVA - Cơm Công Nhân?';

const WEEKDAYS_VI = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function formatDateVi(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${WEEKDAYS_VI[d.getDay()]}, Ngày ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export const getHeaderMessage = (message: string | undefined) => {
    const msgTitle = message?.trim() ?? '';
    const headerTitle = msgTitle ?? TITLE;
    const headerMessage: SlackBlock[] = [];
    headerMessage.push({
        type: 'header',
        text: { type: 'plain_text', text: `${TITLE_ICON} ${headerTitle}`, emoji: true },
    });
    headerMessage.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*:date: ${formatDateVi(new Date())}*`,
        },
    });
    headerMessage.push({ type: 'divider' });
    headerMessage.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: '👇 Chọn *Có* hoặc *Không* bên dưới để phản hồi' }],
    });
    return headerMessage;


};