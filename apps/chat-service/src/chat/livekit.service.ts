import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly url = process.env.LIVEKIT_URL;
  private readonly apiKey = process.env.LIVEKIT_API_KEY;
  private readonly apiSecret = process.env.LIVEKIT_API_SECRET;

  isConfigured() {
    return Boolean(this.url && this.apiKey && this.apiSecret);
  }

  async createRoomToken(params: {
    roomName: string;
    identity: string;
    name?: string;
    metadata?: string;
    role?: 'HOST' | 'VIEWER';
  }) {
    if (!this.url || !this.apiKey || !this.apiSecret) {
      throw new ServiceUnavailableException('LiveKit chưa được cấu hình');
    }

    const token = new AccessToken(this.apiKey, this.apiSecret, {
      identity: params.identity,
      name: params.name,
      metadata: params.metadata,
      ttl: '2h',
    });

    const canPublish = params.role !== 'VIEWER';
    token.addGrant({
      room: params.roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
      canPublishData: canPublish,
    });

    return {
      url: this.url,
      token: await token.toJwt(),
      roomName: params.roomName,
      role: params.role ?? 'HOST',
    };
  }
}
