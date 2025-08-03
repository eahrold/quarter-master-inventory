import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { testDb } from "../../test/setup";
import { db, users, troops } from "../../db";
import usersRouter from "../users";
import { createTestTroop, createTestUser, generateTestToken, cleanupTestData } from "../../test/utils";

// Create test app with middleware
const createTestApp = () => {
  const app = new Hono();
  
  // Mock tenant middleware
  app.use("*", async (c, next) => {
    const troopSlug = c.req.header("X-Troop-Slug");
    if (troopSlug) {
      const [troop] = await testDb
        .select()
        .from(troops)
        .where(eq(troops.slug, troopSlug))
        .limit(1);
      
      if (troop) {
        c.set("troop", troop);
      }
    }
    await next();
  });

  // Mock auth middleware
  app.use("*", async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret") as any;
        
        // Get user from database
        const [user] = await testDb
          .select({
            id: users.id,
            role: users.role,
            troopId: users.troopId,
            username: users.username,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, decoded.userId))
          .limit(1);
        
        if (user) {
          c.set("user", user);
        }
      } catch (error) {
        return c.json({ error: "Invalid token" }, 401);
      }
    }
    await next();
  });
  
  app.route("/", usersRouter);
  return app;
};

describe("Users API", () => {
  let testTroopId: string;
  let adminUserId: string;
  let leaderUserId: string;
  let scoutUserId: string;
  let adminToken: string;
  let leaderToken: string;
  let scoutToken: string;
  let app: Hono;

  beforeAll(async () => {
    app = createTestApp();
    
    // Create test troop
    const troop = await createTestTroop("test-users-troop");
    testTroopId = troop.id;

    // Create test users
    const admin = await createTestUser({
      troopId: testTroopId,
      username: "admin",
      email: "admin@test.com",
      role: "admin",
    });
    adminUserId = admin.id;

    const leader = await createTestUser({
      troopId: testTroopId,
      username: "leader",
      email: "leader@test.com",
      role: "leader",
    });
    leaderUserId = leader.id;

    const scout = await createTestUser({
      troopId: testTroopId,
      username: "scout",
      email: "scout@test.com",
      role: "scout",
    });
    scoutUserId = scout.id;

    // Generate tokens
    adminToken = generateTestToken(adminUserId, testTroopId, "admin");
    leaderToken = generateTestToken(leaderUserId, testTroopId, "leader");
    scoutToken = generateTestToken(scoutUserId, testTroopId, "scout");
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe("GET /", () => {
    it("should list users for admin", async () => {
      const req = new Request("http://localhost/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.users.length).toBe(3);
      
      // Check that passwords are not included
      expect(data.users[0]).not.toHaveProperty("passwordHash");
    });

    it("should list users for leader", async () => {
      const req = new Request("http://localhost/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
    });

    it("should deny access for scout", async () => {
      const req = new Request("http://localhost/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const req = new Request("http://localhost/", {
        method: "GET",
        headers: {
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /:id", () => {
    it("should get user details for admin", async () => {
      const req = new Request(`http://localhost/${scoutUserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(scoutUserId);
      expect(data.user.username).toBe("scout");
      expect(data.user).not.toHaveProperty("passwordHash");
    });

    it("should return 404 for non-existent user", async () => {
      const req = new Request("http://localhost/non-existent-id", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(404);
    });

    it("should deny access for scout", async () => {
      const req = new Request(`http://localhost/${scoutUserId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /", () => {
    it("should create new user as admin", async () => {
      const newUserData = {
        username: "newuser",
        email: "newuser@test.com",
        password: "password123",
        role: "scout",
      };

      const req = new Request("http://localhost/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.username).toBe("newuser");
      expect(data.user.email).toBe("newuser@test.com");
      expect(data.user.role).toBe("scout");
      expect(data.user).not.toHaveProperty("passwordHash");

      // Verify user was created in database
      const [createdUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.email, "newuser@test.com"))
        .limit(1);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.troopId).toBe(testTroopId);
    });

    it("should reject duplicate email", async () => {
      const duplicateUserData = {
        username: "duplicate",
        email: "admin@test.com", // Already exists
        password: "password123",
        role: "scout",
      };

      const req = new Request("http://localhost/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateUserData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(409);
      
      const data = await res.json();
      expect(data.error).toBe("User with this email already exists");
    });

    it("should validate input data", async () => {
      const invalidUserData = {
        username: "ab", // Too short
        email: "invalid-email",
        password: "123", // Too short
        role: "invalid-role",
      };

      const req = new Request("http://localhost/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invalidUserData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
    });

    it("should deny access for non-admin", async () => {
      const newUserData = {
        username: "blocked",
        email: "blocked@test.com",
        password: "password123",
        role: "scout",
      };

      const req = new Request("http://localhost/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });
  });

  describe("PUT /:id", () => {
    let testUserId: string;

    beforeEach(async () => {
      const testUser = await createTestUser({
        troopId: testTroopId,
        username: "updatetest",
        email: "updatetest@test.com",
        role: "scout",
      });
      testUserId = testUser.id;
    });

    it("should update user as admin", async () => {
      const updateData = {
        username: "updated-user",
        role: "leader",
      };

      const req = new Request(`http://localhost/${testUserId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.user.username).toBe("updated-user");
      expect(data.user.role).toBe("leader");
    });

    it("should prevent admin from demoting themselves", async () => {
      const updateData = {
        role: "scout",
      };

      const req = new Request(`http://localhost/${adminUserId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
      
      const data = await res.json();
      expect(data.error).toBe("Cannot change your own admin role");
    });

    it("should deny access for non-admin", async () => {
      const updateData = {
        username: "blocked-update",
      };

      const req = new Request(`http://localhost/${testUserId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /:id", () => {
    let testUserId: string;

    beforeEach(async () => {
      const testUser = await createTestUser({
        troopId: testTroopId,
        username: "deletetest",
        email: "deletetest@test.com",
        role: "scout",
      });
      testUserId = testUser.id;
    });

    it("should delete user as admin", async () => {
      const req = new Request(`http://localhost/${testUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.message).toBe("User deleted successfully");

      // Verify user was deleted from database
      const [deletedUser] = await testDb
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);
      
      expect(deletedUser).toBeUndefined();
    });

    it("should prevent admin from deleting themselves", async () => {
      const req = new Request(`http://localhost/${adminUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
      
      const data = await res.json();
      expect(data.error).toBe("Cannot delete your own account");
    });

    it("should deny access for non-admin", async () => {
      const req = new Request(`http://localhost/${testUserId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "X-Troop-Slug": "test-users-troop",
        },
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });
  });

  describe("PUT /:id/password", () => {
    it("should allow user to change their own password", async () => {
      const passwordData = {
        currentPassword: "password123",
        newPassword: "newpassword123",
      };

      const req = new Request(`http://localhost/${scoutUserId}/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.message).toBe("Password updated successfully");

      // Verify password was actually changed
      const [user] = await testDb
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, scoutUserId))
        .limit(1);
      
      const isNewPasswordValid = await bcrypt.compare("newpassword123", user.passwordHash);
      expect(isNewPasswordValid).toBe(true);
    });

    it("should reject incorrect current password", async () => {
      const passwordData = {
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
      };

      const req = new Request(`http://localhost/${scoutUserId}/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe("Current password is incorrect");
    });

    it("should deny non-admin from changing other user's password", async () => {
      const passwordData = {
        currentPassword: "password123",
        newPassword: "blocked123",
      };

      const req = new Request(`http://localhost/${adminUserId}/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "X-Troop-Slug": "test-users-troop",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      const res = await app.request(req);
      expect(res.status).toBe(403);
    });
  });
});