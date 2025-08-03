import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { testDb } from "../../test/setup";
import { items, transactions, users, troops } from "../../db/schema";
import { createTestTroop, createTestUser, getAuthToken } from "../../test/utils";
import itemsApp from "../items";

// Create test app with mock middleware (similar to users.test.ts)
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
        // Invalid token
      }
    }
    await next();
  });

  app.route("/api/items", itemsApp);
  return app;
};

const app = createTestApp();

describe("Items API", () => {
  // Helper function to make authenticated requests
  const makeRequest = (path: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      "X-Troop-Slug": testTroop?.slug || "test-troop-123",
    };
    return app.request(path, { ...options, headers });
  };

  const makeAuthRequest = (path: string, token: string, options: RequestInit = {}) => {
    const headers = {
      Authorization: `Bearer ${token}`,
      "X-Troop-Slug": testTroop?.slug || "test-troop-123",
      ...options.headers,
    };
    return app.request(path, { ...options, headers });
  };
  let testTroop: { id: string; name: string; slug: string };
  let adminUser: any;
  let leaderUser: any;
  let scoutUser: any;
  let adminToken: string;
  let leaderToken: string;
  let scoutToken: string;
  let testItem: any;

  beforeEach(async () => {
    // Database is cleared automatically by setup.ts beforeEach hook

    // Create test troop
    testTroop = await createTestTroop("test-troop-123");

    // Create test users with different roles
    adminUser = await createTestUser({
      troopId: testTroop.id,
      username: "admin",
      email: "admin@test.com",
      role: "admin",
    });

    leaderUser = await createTestUser({
      troopId: testTroop.id,
      username: "leader",
      email: "leader@test.com",
      role: "leader",
    });

    scoutUser = await createTestUser({
      troopId: testTroop.id,
      username: "scout",
      email: "scout@test.com",
      role: "scout",
    });

    // Generate tokens
    adminToken = getAuthToken(adminUser.id, adminUser.troopId, adminUser.role);
    leaderToken = getAuthToken(leaderUser.id, leaderUser.troopId, leaderUser.role);
    scoutToken = getAuthToken(scoutUser.id, scoutUser.troopId, scoutUser.role);

    // Create test item
    const itemResult = await testDb
      .insert(items)
      .values({
        troopId: testTroop.id,
        name: "Test Tent",
        description: "A test camping tent",
        category: "permanent",
        locationSide: "left",
        locationLevel: "high",
        status: "available",
        qrCode: "QR-TEST-123",
      })
      .returning();
    testItem = itemResult[0];
  });

  afterEach(async () => {
    // Cleanup handled by setup.ts afterEach hook
  });

  describe("GET /api/items", () => {
    it("should list items for authenticated user", async () => {
      const res = await makeAuthRequest("/api/items", adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toBe("Test Tent");
    });

    it("should filter items by category", async () => {
      // Create another item with different category
      await testDb.insert(items).values({
        troopId: testTroop.id,
        name: "Paper Plates",
        category: "staples",
        locationSide: "right",
        locationLevel: "low",
        status: "available",
        qrCode: "QR-TEST-456",
      });

      const res = await makeAuthRequest("/api/items?category=permanent", adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].category).toBe("permanent");
    });

    it("should filter items by location", async () => {
      const res = await makeAuthRequest("/api/items?location=left-high", adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].locationSide).toBe("left");
      expect(data.items[0].locationLevel).toBe("high");
    });

    it("should search items by name", async () => {
      const res = await makeAuthRequest("/api/items?search=tent", adminToken);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].name).toContain("Tent");
    });

    it("should require authentication", async () => {
      const res = await makeRequest("/api/items");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/items/:id", () => {
    it("should get item details for authenticated user", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.item.id).toBe(testItem.id);
      expect(data.item.name).toBe("Test Tent");
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.request("/api/items/non-existent-id", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await app.request(`/api/items/${testItem.id}`);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/items", () => {
    const newItemData = {
      name: "New Sleeping Bag",
      description: "A warm sleeping bag",
      category: "permanent" as const,
      locationSide: "right" as const,
      locationLevel: "middle" as const,
    };

    it("should create item for admin", async () => {
      const res = await app.request("/api/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItemData),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.item.name).toBe(newItemData.name);
      expect(data.item.status).toBe("available");
      expect(data.item.qrCode).toBeDefined();
    });

    it("should create item for leader", async () => {
      const res = await app.request("/api/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItemData),
      });

      expect(res.status).toBe(201);
    });

    it("should reject creation for scout", async () => {
      const res = await app.request("/api/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newItemData),
      });

      expect(res.status).toBe(403);
    });

    it("should validate required fields", async () => {
      const res = await app.request("/api/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "" }), // Missing required fields
      });

      expect(res.status).toBe(400);
    });

    it("should require authentication", async () => {
      const res = await app.request("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemData),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/items/:id", () => {
    const updateData = {
      name: "Updated Tent Name",
      description: "Updated description",
      status: "needs_repair" as const,
    };

    it("should update item for admin", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.item.name).toBe(updateData.name);
      expect(data.item.status).toBe(updateData.status);
    });

    it("should update item for leader", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(200);
    });

    it("should reject update for scout", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.request("/api/items/non-existent-id", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/items/:id", () => {
    it("should delete item for admin", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      
      // Verify item is deleted
      const getRes = await app.request(`/api/items/${testItem.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getRes.status).toBe(404);
    });

    it("should reject deletion for leader", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${leaderToken}` },
      });

      expect(res.status).toBe(403);
    });

    it("should reject deletion for scout", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${scoutToken}` },
      });

      expect(res.status).toBe(403);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.request("/api/items/non-existent-id", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await app.request(`/api/items/${testItem.id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/items/:id/checkout", () => {
    const checkoutData = {
      checkedOutBy: "John Scout",
      notes: "For weekend camping trip",
    };

    it("should checkout item for scout", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.item.status).toBe("checked_out");
    });

    it("should checkout item for leader", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      expect(res.status).toBe(200);
    });

    it("should checkout item for admin", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      expect(res.status).toBe(200);
    });

    it("should reject checkout of already checked out item", async () => {
      // First checkout
      await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      // Second checkout should fail
      const res = await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.request("/api/items/non-existent-id/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkoutData),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/items/:id/checkin", () => {
    const checkinData = {
      notes: "Returned in good condition",
    };

    beforeEach(async () => {
      // Checkout the item first
      await testDb
        .update(items)
        .set({ status: "checked_out" })
        .where({ id: testItem.id });
    });

    it("should checkin item for scout", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.item.status).toBe("available");
    });

    it("should checkin item for leader", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${leaderToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      expect(res.status).toBe(200);
    });

    it("should checkin item for admin", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      expect(res.status).toBe(200);
    });

    it("should reject checkin of available item", async () => {
      // Set item back to available
      await testDb
        .update(items)
        .set({ status: "available" })
        .where({ id: testItem.id });

      const res = await app.request(`/api/items/${testItem.id}/checkin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await app.request("/api/items/non-existent-id/checkin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${scoutToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkinData),
      });

      expect(res.status).toBe(404);
    });

    it("should require authentication", async () => {
      const res = await app.request(`/api/items/${testItem.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checkinData),
      });
      expect(res.status).toBe(401);
    });
  });

  describe("Multi-tenant isolation", () => {
    let otherTroop: any;
    let otherUser: any;
    let otherToken: string;
    let otherItem: any;

    beforeEach(async () => {
      // Create another troop and user
      otherTroop = await createTestTroop("other-troop-456");

      otherUser = await createTestUser({
        troopId: otherTroop.id,
        username: "other-admin",
        email: "other@test.com",
        role: "admin",
      });

      otherToken = getAuthToken(otherUser.id, otherUser.troopId, otherUser.role);

      // Create item in other troop
      const otherItemResult = await testDb
        .insert(items)
        .values({
          troopId: otherTroop.id,
          name: "Other Troop Item",
          category: "permanent",
          locationSide: "left",
          locationLevel: "low",
          status: "available",
          qrCode: "QR-OTHER-123",
        })
        .returning();
      otherItem = otherItemResult[0];
    });

    it("should not list items from other troops", async () => {
      const res = await app.request("/api/items", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].troopId).toBe(testTroop.id);
    });

    it("should not access items from other troops", async () => {
      const res = await app.request(`/api/items/${otherItem.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });
});