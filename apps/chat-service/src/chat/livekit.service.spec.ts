import { decodeJwt } from 'jose';
import { LiveKitService } from './livekit.service';

describe('LiveKitService grants', () => {
  const previous = { ...process.env };

  beforeAll(() => {
    process.env.LIVEKIT_URL = 'wss://live.example.test';
    process.env.LIVEKIT_API_KEY = 'test-key';
    process.env.LIVEKIT_API_SECRET = 'test-secret-with-enough-length';
  });

  afterAll(() => {
    process.env = previous;
  });

  it('creates a subscribe-only viewer token', async () => {
    const service = new LiveKitService();
    const result = await service.createRoomToken({
      roomName: 'live-room',
      identity: 'viewer-1',
      role: 'VIEWER',
    });
    const payload = decodeJwt(result.token) as {
      video?: Record<string, unknown>;
    };
    expect(payload.video).toMatchObject({
      roomJoin: true,
      room: 'live-room',
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    });
  });

  it('creates a publishing host token', async () => {
    const service = new LiveKitService();
    const result = await service.createRoomToken({
      roomName: 'live-room',
      identity: 'host-1',
      role: 'HOST',
    });
    const payload = decodeJwt(result.token) as {
      video?: Record<string, unknown>;
    };
    expect(payload.video).toMatchObject({
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
  });
});
