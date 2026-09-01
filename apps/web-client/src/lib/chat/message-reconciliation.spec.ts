import { mergeFetchedMessages, reconcileIncomingMessage } from './message-reconciliation';

const pending = (id: string, content = 'Xin chào', status = 'SENDING') => ({
  id,
  senderId: 'me',
  content,
  status,
  isOwn: true,
});

const saved = (id: string, content = 'Xin chào') => ({
  id,
  senderId: 'me',
  content,
  status: 'SENT',
});

describe('reconcileIncomingMessage', () => {
  it('replaces exact optimistic message using tempId', () => {
    const messages = [pending('tmp-1'), pending('tmp-2')];

    const result = reconcileIncomingMessage(messages, saved('saved-2'), 'me', 'tmp-2');

    expect(result.map((message) => message.id)).toEqual(['tmp-1', 'saved-2']);
    expect(result[1]).toMatchObject({ isOwn: true, status: 'SENT' });
  });

  it('does not merge two messages with identical content without matching tempId', () => {
    const messages = [pending('tmp-1'), pending('tmp-2')];

    const result = reconcileIncomingMessage(messages, saved('saved-3'), 'me');

    expect(result.map((message) => message.id)).toEqual(['tmp-1', 'tmp-2', 'saved-3']);
  });

  it('ignores duplicate canonical or legacy events by persisted message id', () => {
    const messages = [{ ...saved('saved-1'), isOwn: true }];

    const result = reconcileIncomingMessage(messages, saved('saved-1'), 'me');

    expect(result).toBe(messages);
  });

  it('replaces a timed-out message when its late broadcast carries tempId', () => {
    const messages = [pending('tmp-failed', 'Chậm mạng', 'FAILED')];

    const result = reconcileIncomingMessage(messages, saved('saved-late', 'Chậm mạng'), 'me', 'tmp-failed');

    expect(result).toEqual([
      expect.objectContaining({ id: 'saved-late', status: 'SENT', isOwn: true }),
    ]);
  });
});

describe('mergeFetchedMessages', () => {
  it('keeps realtime messages received while history is loading', () => {
    const current = [saved('saved-realtime')];
    const fetched = [saved('saved-history')];

    expect(mergeFetchedMessages(current, fetched).map((message) => message.id))
      .toEqual(['saved-history', 'saved-realtime']);
  });

  it('keeps optimistic messages and deduplicates persisted messages', () => {
    const current = [saved('saved-1'), pending('tmp-1')];
    const fetched = [saved('saved-1')];

    expect(mergeFetchedMessages(current, fetched).map((message) => message.id))
      .toEqual(['saved-1', 'tmp-1']);
  });
});