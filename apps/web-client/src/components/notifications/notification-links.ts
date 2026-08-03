export function getNotificationActionUrl(type: string, relatedId?: string | null): string | undefined {
  if (type === 'FRIEND_REQUEST' || type === 'FRIEND_ACCEPT') return '/friends';
  if (relatedId && ['LIKE', 'COMMENT', 'MENTION', 'SHARE'].includes(type)) {
    return `/posts/${encodeURIComponent(relatedId)}`;
  }
  return undefined;
}
