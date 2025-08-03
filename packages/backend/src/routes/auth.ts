import { Hono } from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db, users, troops } from "../db";
import { loginSchema, registerSchema } from "@quartermaster/shared";
import { authenticate } from "../middleware/auth";

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

// Login endpoint
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Find user by email
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        username: users.username,
        role: users.role,
        troopId: users.troopId,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Get troop information
    const [troop] = await db
      .select({
        id: troops.id,
        name: troops.name,
        slug: troops.slug,
      })
      .from(troops)
      .where(eq(troops.id, user.troopId))
      .limit(1);

    if (!troop) {
      return c.json({ error: "Troop not found" }, 500);
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret";
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
    
    const token = jwt.sign(
      {
        userId: user.id,
        troopId: user.troopId,
        role: user.role,
      } as any,
      jwtSecret,
      { expiresIn: jwtExpiresIn } as any
    ) as string;

    // Return user data and token
    return c.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        troopId: user.troopId,
      },
      token,
      troop: {
        id: troop.id,
        name: troop.name,
        slug: troop.slug,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Invalid input data", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Register endpoint
app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    const { username, email, password, troopSlug } = validatedData;

    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return c.json({ error: "User with this email already exists" }, 409);
    }

    // Find troop by slug
    const [troop] = await db
      .select({
        id: troops.id,
        name: troops.name,
        slug: troops.slug,
      })
      .from(troops)
      .where(eq(troops.slug, troopSlug))
      .limit(1);

    if (!troop) {
      return c.json({ error: "Troop not found" }, 404);
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
        role: "scout", // Default role for new registrations
      })
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        troopId: users.troopId,
      });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret";
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
    
    const token = jwt.sign(
      {
        userId: newUser.id,
        troopId: newUser.troopId,
        role: newUser.role,
      } as any,
      jwtSecret,
      { expiresIn: jwtExpiresIn } as any
    ) as string;

    // Return user data and token
    return c.json({
      user: newUser,
      token,
      troop: {
        id: troop.id,
        name: troop.name,
        slug: troop.slug,
      },
    }, 201);
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return c.json({ error: "Invalid input data", details: error.message }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get current user profile (requires authentication)
app.get("/me", authenticate, async (c) => {
  const user = c.get("user");
  
  // Fetch troop information based on user's troopId
  const [troop] = await db
    .select({
      id: troops.id,
      name: troops.name,
      slug: troops.slug,
    })
    .from(troops)
    .where(eq(troops.id, user.troopId))
    .limit(1);

  return c.json({
    user,
    troop: troop || null,
  });
});

// Logout endpoint (client-side token removal)
app.post("/logout", authenticate, async (c) => {
  // Note: With JWT, logout is typically handled client-side by removing the token
  // For enhanced security, you could implement token blacklisting here
  return c.json({ message: "Logged out successfully" });
});

export default app;