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

// GET /api/qr/:itemId - Generate QR code for item
app.get("/:itemId", authenticate, async (c) => {
  const itemId = c.req.param("itemId");
  return c.json({ 
    message: "Generate QR code endpoint - TODO: implement QR system",
    itemId 
  });
});

// POST /api/qr/scan - Process QR code scan
app.post("/scan", authenticate, authorize(["admin", "leader", "scout"]), async (c) => {
  return c.json({ message: "Process QR scan endpoint - TODO: implement QR system" });
});

// GET /api/qr/:itemId/print - Generate printable QR label
app.get("/:itemId/print", authenticate, authorize(["admin", "leader"]), async (c) => {
  const itemId = c.req.param("itemId");
  return c.json({ 
    message: "Generate printable QR label endpoint - TODO: implement QR system",
    itemId 
  });
});

export default app;