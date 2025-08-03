import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { eq, and } from "drizzle-orm";
import { db, users } from "../db";

interface JWTPayload {
  userId: string;
  troopId: string;
  role: string;
}

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

/**
 * Middleware to authenticate requests using JWT tokens
 * Expects Authorization header: "Bearer <token>"
 * BYPASS: In development, uses mock user for localhost
 */
export async function authenticate(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
  // DEVELOPMENT BYPASS: Skip auth for localhost
  if (process.env.NODE_ENV === "development") {
    // Use mock admin user for development
    const mockUser = {
      id: "dev-user-id",
      role: "admin",
      troopId: "dev-troop-id", 
      username: "admin",
      email: "admin@localhost.dev",
    };
    
    console.log("🔓 Development mode: Bypassing authentication, using mock admin user");
    c.set("user", mockUser);
    await next();
    return;
  }

  const authHeader = c.req.header("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    // Verify JWT token
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as JWTPayload;

    // Verify user still exists and belongs to the correct troop
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        troopId: users.troopId,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(
        and(
          eq(users.id, payload.userId),
          eq(users.troopId, payload.troopId)
        )
      )
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid token or user not found" }, 401);
    }

    // Set user in context for use by subsequent middleware and handlers
    c.set("user", user);
    await next();
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json({ error: "Invalid token" }, 401);
  }
}

/**
 * Middleware factory to authorize users based on roles
 * @param allowedRoles - Array of roles that can access the endpoint
 */
export function authorize(allowedRoles: string[]) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get("user");
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ 
        error: "Insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: user?.role 
      }, 403);
    }
    
    await next();
  };
}