export interface ReconciledMessage {
  id: string;
  senderId?: string;
  status?: string;
  isOwn?: boolean;
  [key: string]: unknown;
}

export function reconcileIncomingMessage<T extends ReconciledMessage>(
  messages: T[],
  incomingMessage: T,
  currentUserId?: string,
  tempId?: string,
): T[] {
  if (messages.some((message) => message.id === incomingMessage.id)) {
    return messages;
  }

  const reconciled = {
    ...incomingMessage,
    isOwn: Boolean(currentUserId && incomingMessage.senderId === currentUserId),
    status: incomingMessage.status || 'SENT',
  } as T;

  if (tempId) {
    const pendingIndex = messages.findIndex((message) => message.id === tempId);
    if (pendingIndex !== -1) {
      const nextMessages = [...messages];
      nextMessages[pendingIndex] = reconciled;
      return nextMessages;
    }
  }

  return [...messages, reconciled];
}

export function reconcileMessageAck<T extends ReconciledMessage>(
  messages: T[],
  tempId: string,
  savedMessage: T,
  currentUserId?: string,
): T[] {
  if (messages.some((message) => message.id === savedMessage.id)) {
    return messages.filter((message) => message.id !== tempId);
  }

  return reconcileIncomingMessage(messages, savedMessage, currentUserId, tempId);
}

export function mergeFetchedMessages<T extends ReconciledMessage>(
  currentMessages: T[],
  fetchedMessages: T[],
): T[] {
  const fetchedIds = new Set(fetchedMessages.map((message) => message.id));
  return [
    ...fetchedMessages,
    ...currentMessages.filter((message) => !fetchedIds.has(message.id)),
  ];
}