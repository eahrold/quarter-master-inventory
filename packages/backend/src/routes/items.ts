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

// GET /api/items - List items with filters
app.get("/", authenticate, async (c) => {
  return c.json({ message: "List items endpoint - TODO: implement inventory CRUD" });
});

// GET /api/items/:id - Get item details
app.get("/:id", authenticate, async (c) => {
  const itemId = c.req.param("id");
  return c.json({ 
    message: "Get item details endpoint - TODO: implement inventory CRUD",
    itemId 
  });
});

// POST /api/items - Create new item (Leader+ only)
app.post("/", authenticate, authorize(["admin", "leader"]), async (c) => {
  return c.json({ message: "Create item endpoint - TODO: implement inventory CRUD" });
});

// PUT /api/items/:id - Update item (Leader+ only)
app.put("/:id", authenticate, authorize(["admin", "leader"]), async (c) => {
  const itemId = c.req.param("id");
  return c.json({ 
    message: "Update item endpoint - TODO: implement inventory CRUD",
    itemId 
  });
});

// DELETE /api/items/:id - Delete item (Admin only)
app.delete("/:id", authenticate, authorize(["admin"]), async (c) => {
  const itemId = c.req.param("id");
  return c.json({ 
    message: "Delete item endpoint - TODO: implement inventory CRUD",
    itemId 
  });
});

// POST /api/items/:id/checkout - Check out item
app.post("/:id/checkout", authenticate, authorize(["admin", "leader", "scout"]), async (c) => {
  const itemId = c.req.param("id");
  return c.json({ 
    message: "Checkout item endpoint - TODO: implement checkout system",
    itemId 
  });
});

// POST /api/items/:id/checkin - Check in item
app.post("/:id/checkin", authenticate, authorize(["admin", "leader", "scout"]), async (c) => {
  const itemId = c.req.param("id");
  return c.json({ 
    message: "Checkin item endpoint - TODO: implement checkout system",
    itemId 
  });
});

export default app;