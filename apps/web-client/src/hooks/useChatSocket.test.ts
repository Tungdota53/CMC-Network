import { shouldRefreshSessionAfterDisconnect } from './useChatSocket';

describe('shouldRefreshSessionAfterDisconnect', () => {
  it('refreshes only after an explicit server disconnect', () => {
    expect(shouldRefreshSessionAfterDisconnect('io server disconnect')).toBe(true);
    expect(shouldRefreshSessionAfterDisconnect('transport close')).toBe(false);
    expect(shouldRefreshSessionAfterDisconnect('io client disconnect')).toBe(false);
  });
});