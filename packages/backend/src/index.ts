import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { serve } from "@hono/node-server";

// Import routes
import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import userRoutes from "./routes/users";
import qrRoutes from "./routes/qr";

// Type definitions for Hono context variables
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

// Global middleware
app.use("*", logger());
app.use("*", prettyJSON());

// CORS configuration
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      ...(process.env.CORS_ORIGINS?.split(",") || []),
    ],
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (c) =>
  c.json({
    status: "ok",
    message: "Quarter Master API Server",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
);

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/items", itemRoutes);
app.route("/api/users", userRoutes);
app.route("/api/qr", qrRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Global error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  
  // Don't expose internal errors in production
  const isDev = process.env.NODE_ENV === "development";
  
  return c.json(
    {
      error: "Internal Server Error",
      ...(isDev && { details: err.message, stack: err.stack }),
    },
    500
  );
});

// Start server
const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Quarter Master API Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;