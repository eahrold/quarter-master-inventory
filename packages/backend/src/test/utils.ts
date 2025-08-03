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

export const createTestTroop = async (slug: string = 'test-troop-101'): Promise<TestTroop> => {
  const testTroop = {
    id: crypto.randomUUID(),
    name: `Test Troop ${slug}`,
    slug,
  };

  await testDb.insert(troops).values(testTroop);
  return testTroop;
};

export const createTestUser = async (
  userData: { troopId: string; username: string; email: string; role: "admin" | "leader" | "scout" | "viewer" }
): Promise<TestUser> => {
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const testUser = {
    id: crypto.randomUUID(),
    username: userData.username,
    email: userData.email,
    role: userData.role,
    troopId: userData.troopId,
    passwordHash,
  };

  await testDb.insert(users).values(testUser);
  return testUser;
};

export const getAuthToken = (userId: string, troopId: string, role: string): string => {
  return jwt.sign(
    { userId, troopId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const generateTestToken = (userId: string, troopId: string, role: string): string => {
  return getAuthToken(userId, troopId, role);
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

export const mockContext = (): any => {
  const context: any = {
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

export const cleanupTestData = async (): Promise<void> => {
  // Clean up all test data - delete all users and troops
  await testDb.delete(users);
  await testDb.delete(troops);
};