import { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { db, troops } from "../db";

type Variables = {
  troop: { id: string; name: string; slug: string };
};

/**
 * Middleware to extract and validate tenant (troop) context
 * Troop can be identified via:
 * 1. x-troop-slug header
 * 2. troopSlug URL parameter
 * BYPASS: In development, uses mock troop for localhost
 */
export async function extractTenant(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
  // DEVELOPMENT BYPASS: Skip tenant lookup for localhost
  if (process.env.NODE_ENV === "development") {
    // Use the first troop from the database or create a mock one
    try {
      const [existingTroop] = await db
        .select()
        .from(troops)
        .limit(1);

      if (existingTroop) {
        console.log("🏕️ Development mode: Using existing troop:", existingTroop.name);
        c.set("troop", existingTroop);
      } else {
        // Fallback mock troop if no troops exist
        const mockTroop = {
          id: "dev-troop-id",
          name: "Development Troop", 
          slug: "dev-troop",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log("🏕️ Development mode: Using mock troop");
        c.set("troop", mockTroop);
      }
      
      await next();
      return;
    } catch (error) {
      console.error("Development tenant setup error:", error);
    }
  }

  // Extract troop identifier from header or URL parameter
  const troopSlug = 
    c.req.header("x-troop-slug") || 
    c.req.param("troopSlug") ||
    c.req.query("troopSlug");

  if (!troopSlug) {
    return c.json({ error: "Troop identifier required" }, 400);
  }

  try {
    const [troop] = await db
      .select()
      .from(troops)
      .where(eq(troops.slug, troopSlug))
      .limit(1);

    if (!troop) {
      return c.json({ error: "Troop not found" }, 404);
    }

    // Set troop in context for use by subsequent middleware and handlers
    c.set("troop", troop);
    await next();
  } catch (error) {
    console.error("Tenant extraction error:", error);
    return c.json({ error: "Failed to identify troop" }, 500);
  }
}