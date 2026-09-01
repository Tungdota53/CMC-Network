import { getChatThemeClass, normalizeChatTheme, resolveMessageStatus } from './chat-theme';

describe('chat theme', () => {
  it.each(['blue', 'purple', 'green', 'orange'] as const)('keeps supported theme %s', (theme) => {
    expect(normalizeChatTheme(theme)).toBe(theme);
    expect(getChatThemeClass(theme)).toBe(`chat-theme chat-theme-${theme}`);
  });

  it('falls back to blue for invalid persisted values', () => {
    expect(normalizeChatTheme('pink')).toBe('blue');
    expect(normalizeChatTheme(null)).toBe('blue');
  });
});

describe('message receipt status', () => {
  it('restores SEEN for an own message with persisted receipts', () => {
    expect(resolveMessageStatus('DELIVERED', true, 1)).toBe('SEEN');
  });

  it('does not mark incoming messages as SEEN', () => {
    expect(resolveMessageStatus('DELIVERED', false, 2)).toBe('DELIVERED');
  });

  it('preserves own message status without receipts', () => {
    expect(resolveMessageStatus('SENT', true, 0)).toBe('SENT');
  });
});
