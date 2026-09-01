import { AuthService } from './auth.service';
import { prisma } from '@campus-connect/database';
import { getRedisClient } from '@campus-connect/cache';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return {
    ...actual,
    compare: jest.fn((...args: Parameters<typeof actual.compare>) => {
      return actual.compare(...args);
    }),
    genSalt: jest.fn((...args: Parameters<typeof actual.genSalt>) => {
      return actual.genSalt(...args);
    }),
    hash: jest.fn((...args: Parameters<typeof actual.hash>) => {
      return actual.hash(...args);
    }),
  };
});

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest
      .fn()
      .mockImplementation((args) =>
        Array.isArray(args) ? Promise.all(args) : args(mockPrisma),
      ),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

jest.mock('@campus-connect/cache', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getRedisClient: () => ({
      get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((...keys: string[]) => {
        const deleted = keys.filter((key) => store.delete(key)).length;
        return Promise.resolve(deleted);
      }),
      keys: jest.fn((pattern: string) => {
        const prefix = pattern.slice(0, -1);
        return Promise.resolve(
          [...store.keys()].filter((key) => key.startsWith(prefix)),
        );
      }),
      incr: jest.fn((key: string) => {
        const next = Number(store.get(key) ?? 0) + 1;
        store.set(key, String(next));
        return Promise.resolve(next);
      }),
      expire: jest.fn(() => Promise.resolve(1)),
    }),
  };
});

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ALLOWED_EMAIL_DOMAINS = 'st.cmc.edu.vn,st.cmcu.edu.vn,cmc.edu.vn';
});

describe('AuthService — register', () => {
  let service: AuthService;
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
  const email = { sendOtpEmail: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt as never, email as never);
  });

  it('rejects a weak password even when validation pipe is bypassed', async () => {
    await expect(
      service.register({
        email: 'a@st.cmc.edu.vn',
        password: '123456',
        fullName: 'A',
      }),
    ).rejects.toThrow(/mật khẩu/i);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects registration when a verified account already exists', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing',
      emailVerified: true,
      lastLoginAt: new Date(),
    } as never);
    await expect(
      service.register({
        email: 'a@st.cmc.edu.vn',
        password: 'Strong1!',
        fullName: 'A',
      }),
    ).rejects.toThrow(/đã tồn tại/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('never deletes an existing unverified account during registration', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'stuck-user',
      emailVerified: false,
      lastLoginAt: null,
    } as never);

    await expect(
      service.register({
        email: 'stuck@st.cmc.edu.vn',
        password: 'Strong1!',
        fullName: 'Stuck User',
      }),
    ).rejects.toThrow(/đã tồn tại/i);

    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(email.sendOtpEmail).not.toHaveBeenCalled();
  });

  it('stores a hashed password and derived studentId in the pending registration', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await service.register({
      email: 'BIT220001@st.cmc.edu.vn',
      password: 'Strong1!',
      fullName: 'Nguyen Van A',
    });

    expect(result).toMatchObject({ pendingEmail: 'bit220001@st.cmc.edu.vn' });
    expect(prisma.user.create).not.toHaveBeenCalled();

    const pendingRaw = await getRedisClient().get(
      'pending_registration:email:bit220001@st.cmc.edu.vn',
    );
    expect(pendingRaw).not.toBeNull();
    const pending = JSON.parse(pendingRaw as string) as {
      passwordHash: string;
      studentId: string;
    };
    expect(pending.passwordHash).not.toBe('Strong1!');
    expect(pending.studentId).toBe('BIT220001');
    expect(email.sendOtpEmail).toHaveBeenCalledWith(
      'bit220001@st.cmc.edu.vn',
      expect.stringMatching(/^\d{6}$/),
    );
  });
});

describe('AuthService — login', () => {
  let service: AuthService;
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
  const email = { sendOtpEmail: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt as never, email as never);
  });

  it('rejects invalid credentials', async () => {
    jest.mocked(prisma.user.findFirst).mockResolvedValue(null);
    await expect(
      service.login({ identifier: 'x@y.com', password: 'pw' }),
    ).rejects.toThrow(/sai tài khoản/i);
  });

  it('issues a JWT and updates lastLoginAt on success', async () => {
    const hash = await bcrypt.hash('secret', 8);
    jest.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'a@st.cmc.edu.vn',
      fullName: 'A',
      passwordHash: hash,
      role: 'STUDENT',
      emailVerified: true,
      isVerified: true,
      isSuspended: false,
    } as never);
    jest.mocked(prisma.user.update).mockResolvedValue({} as never);

    const result = (await service.login({
      identifier: 'a@st.cmc.edu.vn',
      password: 'secret',
    })) as any;

    expect(result.access_token).toBe('signed.jwt.token');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'a@st.cmc.edu.vn', role: 'STUDENT' },
      { expiresIn: '15m' },
    );
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        email: 'a@st.cmc.edu.vn',
        role: 'STUDENT',
        jti: expect.any(String),
      }),
      { expiresIn: '7d' },
    );
    // DAU/MAU tracking
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });
});

describe('AuthService — sessions', () => {
  let service: AuthService;
  const jwt = {
    signAsync: jest.fn(
      (payload: { jti?: string }, options: { expiresIn: string }) =>
        Promise.resolve(
          options.expiresIn === '7d'
            ? `refresh-token:${payload.jti}`
            : 'access-token',
        ),
    ),
    verifyAsync: jest.fn((token: string) => {
      const [, jti] = token.split(':');
      return Promise.resolve({ sub: 'user-1', jti });
    }),
  };
  const email = { sendOtpEmail: jest.fn().mockResolvedValue(true) };
  const user = {
    id: 'user-1',
    email: 'a@st.cmc.edu.vn',
    fullName: 'A',
    role: 'STUDENT',
    emailVerified: true,
    isVerified: true,
    isSuspended: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt as never, email as never);
  });

  it('keeps independent refresh tokens valid for concurrent devices', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(user as never);

    const first = await service.generateTokens(user);
    const second = await service.generateTokens(user);

    await expect(
      service.refreshToken(first.refresh_token),
    ).resolves.toBeDefined();
    await expect(
      service.refreshToken(second.refresh_token),
    ).resolves.toBeDefined();
  });

  it('logs out only the selected session', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(user as never);

    const first = await service.generateTokens(user);
    const second = await service.generateTokens(user);

    await service.logout(first.refresh_token);

    await expect(service.refreshToken(first.refresh_token)).rejects.toThrow(
      /không hợp lệ/i,
    );
    await expect(
      service.refreshToken(second.refresh_token),
    ).resolves.toBeDefined();
  });

  it('revokes every session after a password change', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      passwordHash: 'current-hash',
    } as never);
    jest.mocked(prisma.user.update).mockResolvedValue(user as never);
    jest.mocked(bcrypt.compare).mockResolvedValue(true as never);
    jest.mocked(bcrypt.genSalt).mockResolvedValue('salt' as never);
    jest.mocked(bcrypt.hash).mockResolvedValue('next-hash' as never);

    const first = await service.generateTokens(user);
    const second = await service.generateTokens(user);

    await service.changePassword('user-1', 'current-password', 'next-password');

    await expect(service.refreshToken(first.refresh_token)).rejects.toThrow(
      /không hợp lệ/i,
    );
    await expect(service.refreshToken(second.refresh_token)).rejects.toThrow(
      /không hợp lệ/i,
    );
  });
});
