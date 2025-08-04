import QRCode from "qrcode";
import { db } from "../db";
import { items } from "../db/schema";
import { and, eq } from "drizzle-orm";

export interface QRCodeData {
  type: "quartermaster_item";
  itemId: string;
  troopSlug: string;
  timestamp: number;
}

export class QRCodeService {
  /**
   * Generate a QR code image (data URL) for an item
   */
  async generateQRCodeImage(itemId: string, troopSlug: string): Promise<string> {
    const qrData: QRCodeData = {
      type: "quartermaster_item",
      itemId,
      troopSlug,
      timestamp: Date.now(),
    };

    const qrString = JSON.stringify(qrData);
    
    return QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: "#D97706", // Orange theme
        light: "#FFFBEB", // Light yellow
      },
      errorCorrectionLevel: "M",
    });
  }

  /**
   * Generate QR code as SVG string for printing
   */
  async generateQRCodeSVG(itemId: string, troopSlug: string): Promise<string> {
    const qrData: QRCodeData = {
      type: "quartermaster_item", 
      itemId,
      troopSlug,
      timestamp: Date.now(),
    };

    const qrString = JSON.stringify(qrData);
    
    return QRCode.toString(qrString, {
      type: "svg",
      width: 256,
      margin: 2,
      color: {
        dark: "#D97706", // Orange theme
        light: "#FFFBEB", // Light yellow
      },
      errorCorrectionLevel: "M",
    });
  }

  /**
   * Parse QR code string and validate format
   */
  parseQRCode(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString);

      // Validate the QR code format
      if (
        data.type !== "quartermaster_item" ||
        !data.itemId ||
        !data.troopSlug ||
        !data.timestamp
      ) {
        return null;
      }

      return {
        type: data.type,
        itemId: data.itemId,
        troopSlug: data.troopSlug,
        timestamp: data.timestamp,
      };
    } catch {
      return null;
    }
  }

  /**
   * Find item by QR code data and validate tenant access
   */
  async findItemByQRCode(qrData: QRCodeData, troopId: string) {
    try {
      const item = await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.id, qrData.itemId),
            eq(items.troopId, troopId)
          )
        )
        .limit(1);

      return item.length > 0 ? item[0] : null;
    } catch (error) {
      console.error("Error finding item by QR code:", error);
      return null;
    }
  }

  /**
   * Generate a printable label with QR code and item info
   * Returns HTML that can be converted to PDF or printed directly
   */
  generatePrintableLabel(
    itemName: string,
    location: string,
    qrCodeSVG: string
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QR Code Label - ${itemName}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .label {
      width: 4in;
      height: 2in;
      border: 2px solid #D97706;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #FFFBEB;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #92400E;
      margin: 0;
    }
    .subtitle {
      font-size: 10px;
      color: #A16207;
      margin: 2px 0 0 0;
    }
    .content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .qr-code {
      flex-shrink: 0;
    }
    .qr-code svg {
      width: 80px;
      height: 80px;
    }
    .item-info {
      flex: 1;
      margin-left: 12px;
    }
    .item-name {
      font-size: 14px;
      font-weight: bold;
      color: #92400E;
      margin: 0 0 4px 0;
      word-wrap: break-word;
    }
    .item-location {
      font-size: 12px;
      color: #A16207;
      margin: 0;
    }
    @media print {
      body { margin: 0; padding: 10px; }
      .label { 
        width: 4in; 
        height: 2in; 
        page-break-after: always; 
      }
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <h1 class="title">Quarter Master</h1>
      <p class="subtitle">Inventory Item</p>
    </div>
    <div class="content">
      <div class="qr-code">
        ${qrCodeSVG}
      </div>
      <div class="item-info">
        <p class="item-name">${itemName}</p>
        <p class="item-location">📍 ${location}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}