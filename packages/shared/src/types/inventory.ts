export interface Item {
  id: string;
  troopId: string;
  name: string;
  description?: string;
  category: ItemCategory;
  locationSide: LocationSide;
  locationLevel: LocationLevel;
  status: ItemStatus;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ItemCategory = "permanent" | "staples";
export type LocationSide = "left" | "right";
export type LocationLevel = "low" | "middle" | "high";
export type ItemStatus = "available" | "checked_out" | "needs_repair";

export interface CreateItemData {
  name: string;
  description?: string;
  category: ItemCategory;
  locationSide: LocationSide;
  locationLevel: LocationLevel;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  category?: ItemCategory;
  locationSide?: LocationSide;
  locationLevel?: LocationLevel;
  status?: ItemStatus;
}

export interface Transaction {
  id: string;
  troopId: string;
  itemId: string;
  userId?: string;
  action: TransactionAction;
  checkedOutBy?: string;
  expectedReturnDate?: Date;
  notes?: string;
  timestamp: Date;
}

export type TransactionAction = "check_out" | "check_in";

export interface CheckoutData {
  userId?: string;
  checkedOutBy: string;
  expectedReturnDate?: Date;
  notes?: string;
}

export interface CheckinData {
  notes?: string;
}

export interface ItemFilters {
  category?: ItemCategory;
  status?: ItemStatus;
  location?: string; // Format: "side-level"
  search?: string;
}

export interface QRCodeData {
  itemId: string;
  troopSlug: string;
  timestamp: number;
}