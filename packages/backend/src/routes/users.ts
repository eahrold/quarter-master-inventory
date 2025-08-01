import { Hono } from "hono";
import { extractTenant } from "../middleware/tenant";
import { authenticate, authorize } from "../middleware/auth";

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
  return c.json({ message: "List users endpoint - TODO: implement user management" });
});

// GET /api/users/:id - Get user details (Admin/Leader only)
app.get("/:id", authenticate, authorize(["admin", "leader"]), async (c) => {
  const userId = c.req.param("id");
  return c.json({ 
    message: "Get user details endpoint - TODO: implement user management",
    userId 
  });
});

// POST /api/users - Create user (Admin only)
app.post("/", authenticate, authorize(["admin"]), async (c) => {
  return c.json({ message: "Create user endpoint - TODO: implement user management" });
});

// PUT /api/users/:id - Update user (Admin only)
app.put("/:id", authenticate, authorize(["admin"]), async (c) => {
  const userId = c.req.param("id");
  return c.json({ 
    message: "Update user endpoint - TODO: implement user management",
    userId 
  });
});

// DELETE /api/users/:id - Delete user (Admin only)
app.delete("/:id", authenticate, authorize(["admin"]), async (c) => {
  const userId = c.req.param("id");
  return c.json({ 
    message: "Delete user endpoint - TODO: implement user management",
    userId 
  });
});

export default app;