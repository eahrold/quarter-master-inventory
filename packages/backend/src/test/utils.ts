import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { vi } from 'vitest';
import { testDb } from './setup';
import { users, troops } from '../db/schema';

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: string;
  troopId: string;
  passwordHash: string;
}

export interface TestTroop {
  id: string;
  name: string;
  slug: string;
}

export const createTestTroop = async (overrides: Partial<TestTroop> = {}): Promise<TestTroop> => {
  const testTroop = {
    id: 'test-troop-1',
    name: 'Test Troop 101',
    slug: 'test-troop-101',
    ...overrides,
  };

  await testDb.insert(troops).values(testTroop);
  return testTroop;
};

export const createTestUser = async (
  troopId: string,
  overrides: Partial<TestUser> = {}
): Promise<TestUser> => {
  const passwordHash = await bcrypt.hash('testpassword123', 12);
  
  const testUser = {
    id: 'test-user-1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'scout',
    troopId,
    passwordHash,
    ...overrides,
  };

  await testDb.insert(users).values(testUser);
  return testUser;
};

export const generateTestToken = (userId: string, troopId: string, role: string): string => {
  return jwt.sign(
    { userId, troopId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const generateExpiredToken = (userId: string, troopId: string, role: string): string => {
  return jwt.sign(
    { userId, troopId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '-1h' } // Already expired
  );
};

export const generateInvalidToken = (): string => {
  return jwt.sign(
    { userId: 'invalid', troopId: 'invalid', role: 'invalid' },
    'wrong-secret',
    { expiresIn: '1h' }
  );
};

export const mockContext = () => {
  const context = {
    variables: new Map(),
    req: {
      header: vi.fn(),
      json: vi.fn(),
    },
    json: vi.fn(),
    set: vi.fn((key: string, value: any) => {
      context.variables.set(key, value);
    }),
    get: vi.fn((key: string) => {
      return context.variables.get(key);
    }),
  };
  
  return context;
};

export const mockNext = vi.fn();