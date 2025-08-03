import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticate, authorize } from '../auth';
import { createTestTroop, createTestUser, generateTestToken, generateExpiredToken, generateInvalidToken, mockContext, mockNext } from '../../test/utils';

// Mock the db module
vi.mock('../../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
  users: {},
}));

describe('authenticate middleware', () => {
  let context: any;
  let next: any;

  beforeEach(() => {
    context = mockContext();
    next = mockNext;
    vi.clearAllMocks();
    // Reset environment to production for tests
    process.env.NODE_ENV = 'test';
  });

  describe('development mode bypass', () => {
    it('should bypass authentication in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await authenticate(context, next);

      expect(consoleSpy).toHaveBeenCalledWith('🔓 Development mode: Bypassing authentication, using mock admin user');
      expect(context.set).toHaveBeenCalledWith('user', {
        id: 'dev-user-id',
        role: 'admin',
        troopId: 'dev-troop-id',
        username: 'admin',
        email: 'admin@localhost.dev',
      });
      expect(next).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('production authentication', () => {
    it('should return 401 when no authorization header is provided', async () => {
      context.req.header.mockReturnValue(undefined);

      await authenticate(context, next);

      expect(context.json).toHaveBeenCalledWith({ error: 'Authentication required' }, 401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not contain Bearer token', async () => {
      context.req.header.mockReturnValue('Basic sometoken');

      await authenticate(context, next);

      // Since 'Basic sometoken' gets processed as a token after removing 'Bearer ', 
      // it becomes an invalid JWT and triggers 'Invalid token' error
      expect(context.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT token is invalid', async () => {
      const invalidToken = generateInvalidToken();
      context.req.header.mockReturnValue(`Bearer ${invalidToken}`);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await authenticate(context, next);

      expect(context.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
      expect(next).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should return 401 when JWT token is expired', async () => {
      const expiredToken = generateExpiredToken('user-1', 'troop-1', 'scout');
      context.req.header.mockReturnValue(`Bearer ${expiredToken}`);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await authenticate(context, next);

      expect(context.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
      expect(next).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should return 401 when user is not found in database', async () => {
      // Mock database to return empty result
      const { db } = await import('../../db');
      (db.limit as any).mockResolvedValue([]);

      const validToken = generateTestToken('nonexistent-user', 'troop-1', 'scout');
      context.req.header.mockReturnValue(`Bearer ${validToken}`);

      await authenticate(context, next);

      expect(context.json).toHaveBeenCalledWith({ error: 'Invalid token or user not found' }, 401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should authenticate successfully with valid token and existing user', async () => {
      const mockUser = {
        id: 'user-1',
        role: 'scout',
        troopId: 'troop-1',
        username: 'testuser',
        email: 'test@example.com',
      };

      // Mock database to return user
      const { db } = await import('../../db');
      (db.limit as any).mockResolvedValue([mockUser]);

      const validToken = generateTestToken('user-1', 'troop-1', 'scout');
      context.req.header.mockReturnValue(`Bearer ${validToken}`);

      await authenticate(context, next);

      expect(context.set).toHaveBeenCalledWith('user', mockUser);
      expect(next).toHaveBeenCalled();
      expect(context.json).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database to throw error
      const { db } = await import('../../db');
      (db.limit as any).mockRejectedValue(new Error('Database connection error'));

      const validToken = generateTestToken('user-1', 'troop-1', 'scout');
      context.req.header.mockReturnValue(`Bearer ${validToken}`);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await authenticate(context, next);

      expect(context.json).toHaveBeenCalledWith({ error: 'Invalid token' }, 401);
      expect(next).not.toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});

describe('authorize middleware', () => {
  let context: any;
  let next: any;

  beforeEach(() => {
    context = mockContext();
    next = mockNext;
    vi.clearAllMocks();
  });

  it('should return 403 when user is not set in context', async () => {
    context.get.mockReturnValue(undefined);
    const authMiddleware = authorize(['admin']);

    await authMiddleware(context, next);

    expect(context.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions',
      requiredRoles: ['admin'],
      userRole: undefined
    }, 403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user role is not in allowed roles', async () => {
    const mockUser = { role: 'scout' };
    context.get.mockReturnValue(mockUser);
    const authMiddleware = authorize(['admin', 'leader']);

    await authMiddleware(context, next);

    expect(context.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions',
      requiredRoles: ['admin', 'leader'],
      userRole: 'scout'
    }, 403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access when user role is in allowed roles', async () => {
    const mockUser = { role: 'admin' };
    context.get.mockReturnValue(mockUser);
    const authMiddleware = authorize(['admin', 'leader']);

    await authMiddleware(context, next);

    expect(next).toHaveBeenCalled();
    expect(context.json).not.toHaveBeenCalled();
  });

  it('should work with single role requirement', async () => {
    const mockUser = { role: 'leader' };
    context.get.mockReturnValue(mockUser);
    const authMiddleware = authorize(['leader']);

    await authMiddleware(context, next);

    expect(next).toHaveBeenCalled();
    expect(context.json).not.toHaveBeenCalled();
  });

  it('should work with multiple role requirements', async () => {
    const mockUser = { role: 'scout' };
    context.get.mockReturnValue(mockUser);
    const authMiddleware = authorize(['admin', 'leader', 'scout', 'viewer']);

    await authMiddleware(context, next);

    expect(next).toHaveBeenCalled();
    expect(context.json).not.toHaveBeenCalled();
  });
});