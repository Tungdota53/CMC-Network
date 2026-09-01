export const CHAT_THEME_NAMES = ['blue', 'purple', 'green', 'orange'] as const;

export type ChatThemeName = (typeof CHAT_THEME_NAMES)[number];

export function normalizeChatTheme(value: string | null | undefined): ChatThemeName {
  return CHAT_THEME_NAMES.includes(value as ChatThemeName)
    ? (value as ChatThemeName)
    : 'blue';
}

export function getChatThemeClass(value: string | null | undefined): string {
  return `chat-theme chat-theme-${normalizeChatTheme(value)}`;
}

export function resolveMessageStatus<T extends string | undefined>(
  status: T,
  isOwn: boolean,
  readReceiptCount: number,
): T | 'SEEN' {
  return isOwn && readReceiptCount > 0 ? 'SEEN' : status;
}
