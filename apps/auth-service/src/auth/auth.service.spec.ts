import { AuthService } from './auth.service';
import { prisma } from '@campus-connect/database';
import { getRedisClient } from '@campus-connect/cache';
import * as bcrypt from 'bcrypt';

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
    getRedisClient: () => ({
      get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve(1);
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

  it('rejects registration when a verified account already exists', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing',
      emailVerified: true,
      lastLoginAt: new Date(),
    } as never);
    await expect(
      service.register({
        email: 'a@st.cmc.edu.vn',
        password: 'pw',
        fullName: 'A',
      }),
    ).rejects.toThrow(/đã tồn tại/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('removes a stuck unverified account before creating a pending registration', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'stuck-user',
      emailVerified: false,
      lastLoginAt: null,
    } as never);

    await expect(
      service.register({
        email: 'stuck@st.cmc.edu.vn',
        password: 'secret',
        fullName: 'Stuck User',
      }),
    ).resolves.toMatchObject({ pendingEmail: 'stuck@st.cmc.edu.vn' });

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'stuck-user' },
    });
  });

  it('stores a hashed password and derived studentId in the pending registration', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await service.register({
      email: 'BIT220001@st.cmc.edu.vn',
      password: 'secret',
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
    expect(pending.passwordHash).not.toBe('secret');
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
      { sub: 'user-1', email: 'a@st.cmc.edu.vn', role: 'STUDENT' },
      { expiresIn: '7d' },
    );
    // DAU/MAU tracking
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });
});
