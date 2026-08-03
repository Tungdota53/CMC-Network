import { getNotificationActionUrl } from './notification-links';

describe('getNotificationActionUrl', () => {
  it.each(['LIKE', 'COMMENT', 'MENTION', 'SHARE'])(
    'opens post for %s notification',
    (type) => {
      expect(getNotificationActionUrl(type, 'post/1')).toBe('/posts/post%2F1');
    },
  );

  it.each(['FRIEND_REQUEST', 'FRIEND_ACCEPT'])(
    'opens friends for %s notification',
    (type) => {
      expect(getNotificationActionUrl(type, 'request-1')).toBe('/friends');
    },
  );

  it('does not create broken link without target', () => {
    expect(getNotificationActionUrl('LIKE', null)).toBeUndefined();
    expect(getNotificationActionUrl('SYSTEM', null)).toBeUndefined();
  });
});
