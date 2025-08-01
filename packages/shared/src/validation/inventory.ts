import { z } from "zod";

export const itemCategorySchema = z.enum(["permanent", "staples"]);
export const locationSideSchema = z.enum(["left", "right"]);
export const locationLevelSchema = z.enum(["low", "middle", "high"]);
export const itemStatusSchema = z.enum(["available", "checked_out", "needs_repair"]);

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  category: itemCategorySchema,
  locationSide: locationSideSchema,
  locationLevel: locationLevelSchema,
});

export const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  description: z.string().max(500).optional(),
  category: itemCategorySchema.optional(),
  locationSide: locationSideSchema.optional(),
  locationLevel: locationLevelSchema.optional(),
  status: itemStatusSchema.optional(),
});

export const checkoutSchema = z.object({
  userId: z.string().uuid().optional(),
  checkedOutBy: z.string().min(1, "Person checking out is required"),
  expectedReturnDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const checkinSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const itemFiltersSchema = z.object({
  category: itemCategorySchema.optional(),
  status: itemStatusSchema.optional(),
  location: z.string().optional(),
  search: z.string().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type ItemFiltersInput = z.infer<typeof itemFiltersSchema>;