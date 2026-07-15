import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

type IceServer = {
  urls: string | string[];
  username?: string;
  credential?: string;
};

@Injectable()
export class WebrtcService {
  // Order matters: cheap/fast public STUN first, then TURN fallback from env.
  // Browser still probes candidates in parallel, but this keeps candidate priority sane.
  private readonly defaultStunServers: IceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:443' },
    { urls: 'stun:openrelay.metered.ca:80' },
  ];

  getIceServers(userId: string) {
    const ttlSeconds = Number(process.env.TURN_TTL_SECONDS || 3600);
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const urls = this.parseUrls(process.env.TURN_URLS);
    const secret = process.env.TURN_REST_API_SECRET;
    const staticUsername = process.env.TURN_USERNAME;
    const staticCredential = process.env.TURN_CREDENTIAL;

    const iceServers: IceServer[] = [...this.defaultStunServers];

    if (urls.length && secret) {
      const username = `${expiresAt}:${userId}`;
      const credential = crypto
        .createHmac('sha1', secret)
        .update(username)
        .digest('base64');
      iceServers.push({ urls, username, credential });
    } else if (urls.length && staticUsername && staticCredential) {
      // Provider fallback for managed TURN accounts that do not expose REST/HMAC.
      // Prefer TURN_REST_API_SECRET in production.
      iceServers.push({ urls, username: staticUsername, credential: staticCredential });
    }

    return {
      iceServers,
      ttlSeconds,
      expiresAt,
      hasTurn: iceServers.some((server) => this.hasTurnUrl(server.urls)),
    };
  }

  private parseUrls(raw?: string) {
    return (raw || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
      .sort((a, b) => this.turnUrlPriority(a) - this.turnUrlPriority(b));
  }

  private turnUrlPriority(url: string) {
    if (url.includes('transport=udp')) return 0;
    if (url.includes('transport=tcp')) return 1;
    if (url.startsWith('turns:')) return 2;
    return 3;
  }

  private hasTurnUrl(urls: string | string[]) {
    const values = Array.isArray(urls) ? urls : [urls];
    return values.some((url) => url.startsWith('turn:') || url.startsWith('turns:'));
  }
}
