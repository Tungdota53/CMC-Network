import { AuthService } from './auth.service';
import { prisma } from '@campus-connect/database';
import * as bcrypt from 'bcrypt';

jest.mock('@campus-connect/database', () => {
  const mockPrisma = {
    $transaction: jest.fn().mockImplementation((args) => Array.isArray(args) ? Promise.all(args) : args(mockPrisma)),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

describe('AuthService — register', () => {
  let service: AuthService;
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt as never);
  });

  it('rejects registration when the email already exists', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as never);
    await expect(
      service.register({ email: 'a@st.cmc.edu.vn', password: 'pw', fullName: 'A' }),
    ).rejects.toThrow(/đã tồn tại/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('hashes the password and derives studentId from a CMC email', async () => {
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    jest.mocked(prisma.user.create).mockResolvedValue({ id: 'new-user' } as never);

    const result = await service.register({
      email: 'BIT220001@st.cmc.edu.vn',
      password: 'secret',
      fullName: 'Nguyen Van A',
    });

    expect(result.userId).toBe('new-user');
    const data = (jest.mocked(prisma.user.create).mock.calls[0][0] as { data: { passwordHash: string; studentId: string } }).data;
    expect(data.passwordHash).not.toBe('secret'); // hashed
    expect(data.studentId).toBe('BIT220001');
  });
});

describe('AuthService — login', () => {
  let service: AuthService;
  const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(jwt as never);
  });

  it('rejects invalid credentials', async () => {
    jest.mocked(prisma.user.findFirst).mockResolvedValue(null as never);
    await expect(service.login({ identifier: 'x@y.com', password: 'pw' })).rejects.toThrow(/sai tài khoản/i);
  });

  it('issues a JWT and updates lastLoginAt on success', async () => {
    const hash = await bcrypt.hash('secret', 8);
    jest.mocked(prisma.user.findFirst).mockResolvedValue({
      id: 'user-1', email: 'a@st.cmc.edu.vn', fullName: 'A', passwordHash: hash, role: 'STUDENT',
    } as never);
    jest.mocked(prisma.user.update).mockResolvedValue({} as never);

    const result = await service.login({ identifier: 'a@st.cmc.edu.vn', password: 'secret' }) as any;

    expect(result.access_token).toBe('signed.jwt.token');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'a@st.cmc.edu.vn', role: 'STUDENT' },
      { expiresIn: '15m' }
    );
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'user-1', email: 'a@st.cmc.edu.vn', role: 'STUDENT' },
      { expiresIn: '7d' }
    );
    // DAU/MAU tracking
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' } }),
    );
  });
});
