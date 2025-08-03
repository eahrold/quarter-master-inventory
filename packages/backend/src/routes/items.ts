import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { and, eq, like, or, asc, desc } from "drizzle-orm";
import { extractTenant } from "../middleware/tenant";
import { authenticate, authorize } from "../middleware/auth";
import { db } from "../db";
import { items, transactions } from "../db/schema";
import { 
  createItemSchema, 
  updateItemSchema, 
  checkoutSchema, 
  checkinSchema, 
  itemFiltersSchema 
} from "@quartermaster/shared";
import type { Item } from "@quartermaster/shared";

type Variables = {
  troop: { id: string; name: string; slug: string };
  user: {
    id: string;
    role: string;
    troopId: string;
    username: string;
    email: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

// All routes require tenant extraction
app.use("*", extractTenant);

// Helper function to generate QR code for items
function generateQRCode(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/items - List items with filters
app.get("/", authenticate, zValidator("query", itemFiltersSchema), async (c) => {
  const troop = c.get("troop");
  const filters = c.req.valid("query");
  
  try {
    // Build where conditions
    const conditions = [eq(items.troopId, troop.id)];
    
    if (filters.category) {
      conditions.push(eq(items.category, filters.category));
    }
    
    if (filters.status) {
      conditions.push(eq(items.status, filters.status));
    }
    
    if (filters.location) {
      const [side, level] = filters.location.split("-");
      if (side && level) {
        conditions.push(
          and(
            eq(items.locationSide, side as any),
            eq(items.locationLevel, level as any)
          )
        );
      }
    }
    
    if (filters.search) {
      conditions.push(
        or(
          like(items.name, `%${filters.search}%`),
          like(items.description, `%${filters.search}%`)
        )
      );
    }
    
    const itemList = await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(asc(items.name));
    
    return c.json({ items: itemList });
  } catch (error) {
    console.error("Error fetching items:", error);
    throw new HTTPException(500, { message: "Failed to fetch items" });
  }
});

// GET /api/items/:id - Get item details
app.get("/:id", authenticate, async (c) => {
  const itemId = c.req.param("id");
  const troop = c.get("troop");
  
  try {
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (item.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    return c.json({ item: item[0] });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error fetching item:", error);
    throw new HTTPException(500, { message: "Failed to fetch item" });
  }
});

// POST /api/items - Create new item (Leader+ only)
app.post("/", authenticate, authorize(["admin", "leader"]), zValidator("json", createItemSchema), async (c) => {
  const troop = c.get("troop");
  const itemData = c.req.valid("json");
  
  try {
    const newItem = await db
      .insert(items)
      .values({
        troopId: troop.id,
        name: itemData.name,
        description: itemData.description,
        category: itemData.category,
        locationSide: itemData.locationSide,
        locationLevel: itemData.locationLevel,
        status: "available",
        qrCode: generateQRCode(),
      })
      .returning();
    
    return c.json({ item: newItem[0] }, 201);
  } catch (error) {
    console.error("Error creating item:", error);
    throw new HTTPException(500, { message: "Failed to create item" });
  }
});

// PUT /api/items/:id - Update item (Leader+ only)
app.put("/:id", authenticate, authorize(["admin", "leader"]), zValidator("json", updateItemSchema), async (c) => {
  const itemId = c.req.param("id");
  const troop = c.get("troop");
  const updateData = c.req.valid("json");
  
  try {
    // Check if item exists and belongs to troop
    const existingItem = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (existingItem.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    const updatedItem = await db
      .update(items)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(items.id, itemId))
      .returning();
    
    return c.json({ item: updatedItem[0] });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error updating item:", error);
    throw new HTTPException(500, { message: "Failed to update item" });
  }
});

// DELETE /api/items/:id - Delete item (Admin only)
app.delete("/:id", authenticate, authorize(["admin"]), async (c) => {
  const itemId = c.req.param("id");
  const troop = c.get("troop");
  
  try {
    // Check if item exists and belongs to troop
    const existingItem = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (existingItem.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    // Delete the item (transactions will be cascade deleted)
    await db.delete(items).where(eq(items.id, itemId));
    
    return c.json({ message: "Item deleted successfully" });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error deleting item:", error);
    throw new HTTPException(500, { message: "Failed to delete item" });
  }
});

// POST /api/items/:id/checkout - Check out item
app.post("/:id/checkout", authenticate, authorize(["admin", "leader", "scout"]), zValidator("json", checkoutSchema), async (c) => {
  const itemId = c.req.param("id");
  const troop = c.get("troop");
  const user = c.get("user");
  const checkoutData = c.req.valid("json");
  
  try {
    // Check if item exists, belongs to troop, and is available
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (item.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    if (item[0].status !== "available") {
      throw new HTTPException(400, { message: "Item is not available for checkout" });
    }
    
    // Update item status and create transaction
    await db.transaction(async (tx) => {
      // Update item status
      await tx
        .update(items)
        .set({ status: "checked_out", updatedAt: new Date() })
        .where(eq(items.id, itemId));
      
      // Create transaction record
      await tx.insert(transactions).values({
        troopId: troop.id,
        itemId: itemId,
        userId: checkoutData.userId || user.id,
        action: "check_out",
        checkedOutBy: checkoutData.checkedOutBy,
        expectedReturnDate: checkoutData.expectedReturnDate,
        notes: checkoutData.notes,
      });
    });
    
    // Return updated item
    const updatedItem = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    
    return c.json({ item: updatedItem[0] });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error checking out item:", error);
    throw new HTTPException(500, { message: "Failed to checkout item" });
  }
});

// POST /api/items/:id/checkin - Check in item
app.post("/:id/checkin", authenticate, authorize(["admin", "leader", "scout"]), zValidator("json", checkinSchema), async (c) => {
  const itemId = c.req.param("id");
  const troop = c.get("troop");
  const user = c.get("user");
  const checkinData = c.req.valid("json");
  
  try {
    // Check if item exists, belongs to troop, and is checked out
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (item.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    if (item[0].status !== "checked_out") {
      throw new HTTPException(400, { message: "Item is not checked out" });
    }
    
    // Update item status and create transaction
    await db.transaction(async (tx) => {
      // Update item status
      await tx
        .update(items)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(items.id, itemId));
      
      // Create transaction record
      await tx.insert(transactions).values({
        troopId: troop.id,
        itemId: itemId,
        userId: user.id,
        action: "check_in",
        notes: checkinData.notes,
      });
    });
    
    // Return updated item
    const updatedItem = await db
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);
    
    return c.json({ item: updatedItem[0] });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error checking in item:", error);
    throw new HTTPException(500, { message: "Failed to checkin item" });
  }
});

export default app;