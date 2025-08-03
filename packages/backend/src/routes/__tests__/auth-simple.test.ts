import { describe, it, expect, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { testDb } from '../../test/setup';
import { users, troops } from '../../db/schema';
import { createTestTroop, createTestUser, generateTestToken } from '../../test/utils';

describe('Auth Logic Tests', () => {
  let testTroop: any;
  let testUser: any;

  beforeEach(async () => {
    // Create test data
    testTroop = await createTestTroop();
    testUser = await createTestUser(testTroop.id);
  });

  describe('Password hashing and verification', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should verify passwords correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT token operations', () => {
    it('should generate valid JWT tokens', () => {
      const token = generateTestToken(testUser.id, testUser.troopId, testUser.role);
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should decode JWT tokens correctly', () => {
      const token = generateTestToken(testUser.id, testUser.troopId, testUser.role);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.troopId).toBe(testUser.troopId);
      expect(decoded.role).toBe(testUser.role);
    });

    it('should reject expired tokens', () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, troopId: testUser.troopId, role: testUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' }
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET!);
      }).toThrow('jwt expired');
    });

    it('should reject tokens with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(
        { userId: testUser.id, troopId: testUser.troopId, role: testUser.role },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      expect(() => {
        jwt.verify(tokenWithWrongSecret, process.env.JWT_SECRET!);
      }).toThrow('invalid signature');
    });
  });

  describe('Database user operations', () => {
    it('should find user by email', async () => {
      const [foundUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1);

      expect(foundUser).toBeTruthy();
      expect(foundUser.id).toBe(testUser.id);
      expect(foundUser.email).toBe(testUser.email);
    });

    it('should find troop by slug', async () => {
      const [foundTroop] = await testDb
        .select()
        .from(troops)
        .where(eq(troops.slug, testTroop.slug))
        .limit(1);

      expect(foundTroop).toBeTruthy();
      expect(foundTroop.id).toBe(testTroop.id);
      expect(foundTroop.slug).toBe(testTroop.slug);
    });

    it('should not find non-existent user', async () => {
      const [foundUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.email, 'nonexistent@example.com'))
        .limit(1);

      expect(foundUser).toBeUndefined();
    });

    it('should not find non-existent troop', async () => {
      const [foundTroop] = await testDb
        .select()
        .from(troops)
        .where(eq(troops.slug, 'non-existent-troop'))
        .limit(1);

      expect(foundTroop).toBeUndefined();
    });

    it('should prevent duplicate email in same troop', async () => {
      const duplicateUser = {
        id: 'duplicate-user',
        troopId: testTroop.id,
        username: 'duplicateuser',
        email: testUser.email, // Same email
        passwordHash: 'hashedpassword',
        role: 'scout' as const,
      };

      await expect(
        testDb.insert(users).values(duplicateUser)
      ).rejects.toThrow();
    });
  });
});