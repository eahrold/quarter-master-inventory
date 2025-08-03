import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { eq, and, ne } from "drizzle-orm";
import { db, users } from "../db";
import { extractTenant } from "../middleware/tenant";
import { authenticate, authorize } from "../middleware/auth";
import { createUserSchema, updateUserSchema, updateUserPasswordSchema } from "@quartermaster/shared";

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

// GET /api/users - List users (Admin/Leader only)
app.get("/", authenticate, authorize(["admin", "leader"]), async (c) => {
  try {
    const troop = c.get("troop");
    
    const troopUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.troopId, troop.id))
      .orderBy(users.createdAt);

    return c.json({ users: troopUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/users/:id - Get user details (Admin/Leader only)
app.get("/:id", authenticate, authorize(["admin", "leader"]), async (c) => {
  try {
    const userId = c.req.param("id");
    const troop = c.get("troop");
    
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/users - Create user (Admin only)
app.post("/", authenticate, authorize(["admin"]), async (c) => {
  try {
    const body = await c.req.json();
    const troop = c.get("troop");
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    const { username, email, password, role } = validatedData;

    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        passwordHash,
        troopId: troop.id,
        role,
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return c.json({ user: newUser }, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Invalid input data", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PUT /api/users/:id - Update user (Admin only)
app.put("/:id", authenticate, authorize(["admin"]), async (c) => {
  try {
    const userId = c.req.param("id");
    const body = await c.req.json();
    const troop = c.get("troop");
    const currentUser = c.get("user");
    
    // Validate input
    const validatedData = updateUserSchema.parse(body);
    
    // Check if user exists and belongs to the troop
    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ))
      .limit(1);

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Prevent admin from demoting themselves
    if (userId === currentUser.id && validatedData.role && validatedData.role !== "admin") {
      return c.json({ error: "Cannot change your own admin role" }, 403);
    }

    // Check if new email already exists (if email is being updated)
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const [emailExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.email, validatedData.email),
          ne(users.id, userId)
        ))
        .limit(1);

      if (emailExists) {
        return c.json({ error: "Email already in use by another user" }, 409);
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return c.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Invalid input data", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
app.delete("/:id", authenticate, authorize(["admin"]), async (c) => {
  try {
    const userId = c.req.param("id");
    const troop = c.get("troop");
    const currentUser = c.get("user");
    
    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return c.json({ error: "Cannot delete your own account" }, 403);
    }

    // Check if user exists and belongs to the troop
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ))
      .limit(1);

    if (!existingUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Delete user
    await db
      .delete(users)
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ));

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PUT /api/users/:id/password - Update user password (Admin or self)
app.put("/:id/password", authenticate, async (c) => {
  try {
    const userId = c.req.param("id");
    const body = await c.req.json();
    const troop = c.get("troop");
    const currentUser = c.get("user");
    
    // Only admin can change other users' passwords, users can change their own
    if (userId !== currentUser.id && currentUser.role !== "admin") {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    
    // Validate input
    const validatedData = updateUserPasswordSchema.parse(body);
    const { currentPassword, newPassword } = validatedData;
    
    // Get user with password hash
    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ))
      .limit(1);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(and(
        eq(users.id, userId),
        eq(users.troopId, troop.id)
      ));

    return c.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Invalid input data", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;