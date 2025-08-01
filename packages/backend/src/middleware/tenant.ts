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
 */
export async function extractTenant(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
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