import { Context, Next } from "hono";
import { ZodSchema, ZodError } from "zod";

/**
 * Middleware factory for request validation using Zod schemas
 * @param schema - Zod schema to validate against
 * @param target - What part of the request to validate ('json', 'query', 'param')
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  target: "json" | "query" | "param" = "json"
) {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      switch (target) {
        case "json":
          data = await c.req.json();
          break;
        case "query":
          data = c.req.query();
          break;
        case "param":
          data = c.req.param();
          break;
        default:
          return c.json({ error: "Invalid validation target" }, 400);
      }

      const parsed = schema.parse(data);
      
      // Store validated data in context
      c.set("validatedData", parsed);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(
          {
            error: "Validation failed",
            details: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          400
        );
      }

      console.error("Validation middleware error:", error);
      return c.json({ error: "Validation error" }, 400);
    }
  };
}

/**
 * Helper to get validated data from context
 */
export function getValidatedData<T>(c: Context): T {
  return c.get("validatedData") as T;
}