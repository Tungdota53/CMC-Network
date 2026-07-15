// frontend/src/types/chat.ts
// Application-layer types for Chat message metadata (JSON column in DB)
// Source: plans/02F-CHAT-SCHEMA.md

// ==================== Message Metadata Types ====================

export type ImageMeta = {
  url: string;
  width: number;
  height: number;
  thumbnailUrl?: string;
};

export type VideoMeta = {
  url: string;
  width: number;
  height: number;
  duration: number;
  thumbnailUrl?: string;
};

export type FileMeta = {
  url: string;
  name: string;
  size: number;
  mimeType: string;
};

export type VoiceMeta = {
  url: string;
  duration: number;
  waveform?: number[];
};

export type StickerMeta = {
  url: string;
  packId?: string;
};

export type GifMeta = {
  url: string;
  width: number;
  height: number;
};

export type LinkMeta = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
};

export type CallMeta = {
  callId: string;
  type: 'VOICE' | 'VIDEO';
  duration?: number;
  status: string;
};

export type PollMeta = {
  question: string;
  options: { id: string; text: string }[];
  votes: Record<string, string[]>;
  isAnonymous?: boolean;
  multipleChoice?: boolean;
};

export type LocationMeta = {
  lat: number;
  lng: number;
  name?: string;
};

export type ForwardedMeta = {
  originalSenderId: string;
  originalSenderName: string;
};

export type ProductCardMeta = {
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
  tradeType: string;
  meetupLocation?: string;
};

// Union type — parse metadata Json? column theo MessageType
export type MessageMetadata =
  | ImageMeta
  | VideoMeta
  | FileMeta
  | VoiceMeta
  | StickerMeta
  | GifMeta
  | LinkMeta
  | CallMeta
  | PollMeta
  | LocationMeta
  | ForwardedMeta
  | ProductCardMeta;
