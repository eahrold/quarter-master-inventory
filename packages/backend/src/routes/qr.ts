import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { extractTenant } from "../middleware/tenant";
import { authenticate, authorize } from "../middleware/auth";
import { db } from "../db";
import { items } from "../db/schema";
import { QRCodeService } from "../services/QRCodeService";

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

const qrService = new QRCodeService();
const app = new Hono<{ Variables: Variables }>();

// Validation schemas
const scanRequestSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
});

// All routes require tenant extraction
app.use("*", extractTenant);

// GET /api/qr/:itemId - Generate QR code for item
app.get("/:itemId", authenticate, async (c) => {
  const itemId = c.req.param("itemId");
  const troop = c.get("troop");
  
  try {
    // Verify item exists and belongs to troop
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (item.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    // Generate QR code image
    const qrCodeDataURL = await qrService.generateQRCodeImage(itemId, troop.slug);
    
    return c.json({
      itemId,
      itemName: item[0].name,
      qrCode: qrCodeDataURL,
      format: "data-url",
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error generating QR code:", error);
    throw new HTTPException(500, { message: "Failed to generate QR code" });
  }
});

// POST /api/qr/scan - Process QR code scan
app.post("/scan", authenticate, authorize(["admin", "leader", "scout"]), zValidator("json", scanRequestSchema), async (c) => {
  const { qrData } = c.req.valid("json");
  const troop = c.get("troop");
  
  try {
    // Parse QR code data
    const parsedQR = qrService.parseQRCode(qrData);
    
    if (!parsedQR) {
      throw new HTTPException(400, { message: "Invalid QR code format" });
    }
    
    // Verify QR code is for the correct troop
    if (parsedQR.troopSlug !== troop.slug) {
      throw new HTTPException(403, { message: "QR code does not belong to your troop" });
    }
    
    // Find the item
    const item = await qrService.findItemByQRCode(parsedQR, troop.id);
    
    if (!item) {
      throw new HTTPException(404, { message: "Item not found or has been deleted" });
    }
    
    return c.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        location: `${item.locationSide}-${item.locationLevel}`,
        status: item.status,
        qrCode: item.qrCode,
      },
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error processing QR scan:", error);
    throw new HTTPException(500, { message: "Failed to process QR code scan" });
  }
});

// GET /api/qr/:itemId/print - Generate printable QR label
app.get("/:itemId/print", authenticate, authorize(["admin", "leader"]), async (c) => {
  const itemId = c.req.param("itemId");
  const troop = c.get("troop");
  
  try {
    // Verify item exists and belongs to troop
    const item = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.troopId, troop.id)))
      .limit(1);
    
    if (item.length === 0) {
      throw new HTTPException(404, { message: "Item not found" });
    }
    
    // Generate QR code SVG for printing
    const qrCodeSVG = await qrService.generateQRCodeSVG(itemId, troop.slug);
    
    // Create location string
    const location = `${item[0].locationSide.charAt(0).toUpperCase() + item[0].locationSide.slice(1)}-${
      item[0].locationLevel.charAt(0).toUpperCase() + item[0].locationLevel.slice(1)
    }`;
    
    // Generate printable HTML
    const printableHTML = qrService.generatePrintableLabel(
      item[0].name,
      location,
      qrCodeSVG
    );
    
    // Return HTML for printing
    c.header("Content-Type", "text/html");
    return c.body(printableHTML);
  } catch (error) {
    if (error instanceof HTTPException) throw error;
    console.error("Error generating printable QR label:", error);
    throw new HTTPException(500, { message: "Failed to generate printable QR label" });
  }
});

export default app;