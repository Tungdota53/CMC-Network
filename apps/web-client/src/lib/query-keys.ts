/**
 * Centralised React Query key factories.
 *
 * Usage:
 *   queryKey: queryKeys.grades.list()
 *   qc.invalidateQueries({ queryKey: queryKeys.grades.all })
 */

function tuple<T extends readonly string[]>(...args: T): T {
  return args;
}

export const queryKeys = {
  // Feed / posts
  feed: {
    all: ['feed'] as const,
    trending: () => ['feed', 'trending'] as const,
    latest: () => ['feed', 'latest'] as const,
  },
  posts: {
    all: ['posts'] as const,
    detail: (id: string) => ['posts', id] as const,
    comments: (id: string) => ['posts', id, 'comments'] as const,
  },
  comments: {
    all: ['comments'] as const,
    list: (postId: string) => ['comments', postId] as const,
  },

  // User / auth
  users: {
    all: ['users'] as const,
    me: () => ['users', 'me'] as const,
    detail: (id: string) => ['users', id] as const,
    friends: (id: string) => ['users', id, 'friends'] as const,
    incomingRequests: (id: string) => ['users', id, 'friend-requests', 'incoming'] as const,
    outgoingRequests: (id: string) => ['users', id, 'friend-requests', 'outgoing'] as const,
    suggestions: (id: string) => ['users', id, 'friend-suggestions'] as const,
    blocked: (id: string) => ['users', id, 'blocked'] as const,
  },

  // Stories
  stories: {
    all: ['stories'] as const,
    feed: () => ['stories', 'feed'] as const,
    my: () => ['stories', 'my'] as const,
  },

  // Grades / academics
  grades: {
    all: ['grades'] as const,
    list: () => ['grades', 'list'] as const,
    summary: () => ['grades', 'summary'] as const,
  },

  // Timetable
  timetable: {
    all: ['timetable'] as const,
    events: () => ['timetable', 'events'] as const,
    classmates: () => ['timetable', 'classmates'] as const,
    freeSlots: () => ['timetable', 'free-slots'] as const,
  },

  // Study groups
  studyGroups: {
    all: ['study-groups'] as const,
    list: () => ['study-groups', 'list'] as const,
    detail: (id: string) => ['study-groups', id] as const,
    joinRequests: (id: string) => ['study-groups', id, 'join-requests'] as const,
  },
  studyRequests: {
    all: ['study-requests'] as const,
    list: () => ['study-requests', 'list'] as const,
  },

  // Materials
  materials: {
    all: ['materials'] as const,
    list: () => ['materials', 'list'] as const,
    detail: (id: string) => ['materials', id] as const,
    bookmarks: () => ['materials', 'bookmarks'] as const,
  },

  // Clubs
  clubs: {
    all: ['clubs'] as const,
    list: () => ['clubs', 'list'] as const,
    detail: (id: string) => ['clubs', id] as const,
  },

  // Events
  events: {
    all: ['events'] as const,
    list: () => ['events', 'list'] as const,
    detail: (id: string) => ['events', id] as const,
  },

  // Marketplace
  marketplace: {
    all: ['marketplace'] as const,
    list: () => ['marketplace', 'list'] as const,
    detail: (id: string) => ['marketplace', id] as const,
  },

  // Professors
  professors: {
    all: ['professors'] as const,
    list: () => ['professors', 'list'] as const,
    detail: (id: string) => ['professors', id] as const,
    reviews: (id: string) => ['professors', id, 'reviews'] as const,
  },

  // Mentors
  mentors: {
    all: ['mentors'] as const,
    list: () => ['mentors', 'list'] as const,
    detail: (id: string) => ['mentors', id] as const,
    sessions: () => ['mentors', 'sessions'] as const,
  },

  // Reputation
  reputation: {
    all: ['reputation'] as const,
    me: () => ['reputation', 'me'] as const,
    leaderboard: () => ['reputation', 'leaderboard'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: () => ['notifications', 'list'] as const,
  },

  // Search
  search: {
    all: ['search'] as const,
    query: (q: string) => ['search', q] as const,
  },

  // Chat
  chat: {
    all: ['chat'] as const,
    conversations: () => ['chat', 'conversations'] as const,
    messages: (id: string) => ['chat', 'messages', id] as const,
  },
} as const;