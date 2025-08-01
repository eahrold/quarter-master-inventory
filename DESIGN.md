# Quarter Master Inventory App - Design Document

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [Frontend Architecture](#frontend-architecture)
- [Backend API Design](#backend-api-design)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [QR Code Integration](#qr-code-integration)
- [Security & Authentication](#security--authentication)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)

## Architecture Overview

The Quarter Master Inventory App is designed as a multi-tenant SaaS application with the following high-level architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│  Hono API    │◄──►│   SQLite DB     │
│   (shadcn/ui)   │    │  (Multi-tenant) │    │   (Drizzle)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│  Camera/QR API  │    │ Authentication  │
│   (Web APIs)    │    │     (JWT)       │
└─────────────────┘    └─────────────────┘
```

### Key Architectural Principles

- **Multi-Tenant**: Complete data isolation between scout troops
- **Mobile-First**: Camera-based QR scanning with responsive design
- **Role-Based Access Control**: Four distinct user roles with granular permissions
- **Real-Time Updates**: Optimistic UI updates with server synchronization
- **Offline-Capable**: QR scanning works offline with sync when online

## Technology Stack

### Frontend

- **React 18** - UI framework with concurrent features
- **TypeScript** - Type safety and developer experience
- **shadcn/ui** - Consistent, accessible component library
- **Tailwind CSS** - Utility-first styling with yellow/orange theme
- **React Query (TanStack Query)** - Server state management and caching
- **Zustand** - Client state management for UI state
- **React Hook Form** - Form handling with validation
- **Zod** - Runtime type validation
- **React Router** - Client-side routing

### Backend

- **Node.js** - Runtime environment
- **Hono** - Fast, lightweight web framework with TypeScript-first design
- **TypeScript** - Type safety across the stack
- **Drizzle ORM** - Type-safe database operations
- **SQLite** - Embedded database (with migration path to PostgreSQL)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **QRCode** - QR code generation

### Development Tools

- **Vite** - Fast build tool and dev server
- **ESLint + Prettier** - Code quality and formatting
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **Docker** - Containerization for deployment

## Database Design

### Multi-Tenant Schema Strategy

Using **Row-Level Security (RLS)** with tenant isolation via `troop_id` foreign key:

```typescript
// drizzle/schema.ts
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// Tenant table - each scout troop is a tenant
export const troops = sqliteTable("troops", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Users with troop association
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  troopId: text("troop_id")
    .notNull()
    .references(() => troops.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", {
    enum: ["admin", "leader", "scout", "viewer"],
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Items with enhanced location tracking
export const items = sqliteTable("items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  troopId: text("troop_id")
    .notNull()
    .references(() => troops.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["permanent", "staples"] }).notNull(),
  locationSide: text("location_side", { enum: ["left", "right"] }).notNull(),
  locationLevel: text("location_level", {
    enum: ["low", "middle", "high"],
  }).notNull(),
  status: text("status", {
    enum: ["available", "checked_out", "needs_repair"],
  }).default("available"),
  qrCode: text("qr_code").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Transaction logging with flexible user tracking
export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  troopId: text("troop_id")
    .notNull()
    .references(() => troops.id, { onDelete: "cascade" }),
  itemId: text("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id), // nullable for non-registered users
  action: text("action", { enum: ["check_out", "check_in"] }).notNull(),
  checkedOutBy: text("checked_out_by"), // manual entry for non-users
  expectedReturnDate: integer("expected_return_date", { mode: "timestamp" }),
  notes: text("notes"),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// Indexes for performance
export const userEmailIndex = index("user_email_idx").on(users.email);
export const itemQRIndex = index("item_qr_idx").on(items.qrCode);
export const transactionItemIndex = index("transaction_item_idx").on(
  transactions.itemId
);
```

### Database Relationships

```typescript
// drizzle/relations.ts
import { relations } from "drizzle-orm";

export const troopsRelations = relations(troops, ({ many }) => ({
  users: many(users),
  items: many(items),
  transactions: many(transactions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  troop: one(troops, {
    fields: [users.troopId],
    references: [troops.id],
  }),
  transactions: many(transactions),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  troop: one(troops, {
    fields: [items.troopId],
    references: [troops.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  troop: one(troops, {
    fields: [transactions.troopId],
    references: [troops.id],
  }),
  item: one(items, {
    fields: [transactions.itemId],
    references: [items.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));
```

## Frontend Architecture

### Component Hierarchy

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── inventory/
│   │   ├── ItemList.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── ItemForm.tsx
│   │   └── LocationSelector.tsx
│   ├── scanner/
│   │   ├── QRScanner.tsx
│   │   ├── CameraPermission.tsx
│   │   └── ScanResult.tsx
│   ├── checkout/
│   │   ├── CheckoutFlow.tsx
│   │   ├── CheckinFlow.tsx
│   │   └── TransactionHistory.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── StatusCards.tsx
│   │   └── RecentActivity.tsx
│   └── layout/
│       ├── AppLayout.tsx
│       ├── Navigation.tsx
│       └── MobileNav.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useItems.ts
│   ├── useTransactions.ts
│   ├── useQRScanner.ts
│   └── useTroop.ts
├── store/
│   ├── auth.ts              # Zustand auth store
│   ├── ui.ts                # UI state (modals, sidebar)
│   └── scanner.ts           # Scanner state
├── lib/
│   ├── api.ts               # API client configuration
│   ├── auth.ts              # Auth utilities
│   ├── qr-utils.ts          # QR code utilities
│   └── validation.ts        # Zod schemas
└── types/
    ├── auth.ts
    ├── inventory.ts
    └── api.ts
```

### Key Frontend Patterns

#### 1. Custom Hooks for Data Fetching

```typescript
// hooks/useItems.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Item, CreateItemData, UpdateItemData } from "@/types/inventory";

export function useItems(filters?: ItemFilters) {
  return useQuery({
    queryKey: ["items", filters],
    queryFn: () => api.items.list(filters),
    staleTime: 30_000, // 30 seconds
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemData) => api.items.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useCheckoutItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: CheckoutData }) =>
      api.items.checkout(itemId, data),
    onMutate: async ({ itemId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["items"] });
      const previousItems = queryClient.getQueryData(["items"]);

      queryClient.setQueryData(["items"], (old: Item[]) =>
        old?.map((item) =>
          item.id === itemId ? { ...item, status: "checked_out" } : item
        )
      );

      return { previousItems };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(["items"], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
```

#### 2. QR Scanner Hook with Camera API

```typescript
// hooks/useQRScanner.ts
import { useState, useRef, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/library";

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera
      });
      setHasPermission(true);
      stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
    } catch (err) {
      setHasPermission(false);
      setError("Camera permission denied");
    }
  };

  const startScanning = async (onResult: (result: string) => void) => {
    if (!hasPermission) {
      await requestPermission();
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader();
      }

      const result = await readerRef.current.decodeOnceFromVideoDevice(
        undefined, // Use default camera
        videoRef.current!
      );

      onResult(result.getText());
    } catch (err) {
      setError("Failed to scan QR code");
    } finally {
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return {
    videoRef,
    isScanning,
    hasPermission,
    error,
    requestPermission,
    startScanning,
    stopScanning,
  };
}
```

#### 3. Zustand Store for Auth State

```typescript
// store/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, LoginCredentials } from "@/types/auth";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { user, token } = await api.auth.login(credentials);
          set({ user, token, isLoading: false });
          // Set token for future API calls
          api.setAuthToken(token);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        api.setAuthToken(null);
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) return;

        try {
          api.setAuthToken(token);
          const user = await api.auth.me();
          set({ user });
        } catch (error) {
          // Token is invalid, clear auth state
          get().logout();
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
```

## Backend API Design

### Multi-Tenant Middleware

```typescript
// middleware/tenant.ts
import { Context, Next } from "hono";
import { db } from "@/db";
import { troops } from "@/db/schema";
import { eq } from "drizzle-orm";

type Variables = {
  troop: { id: string; name: string; slug: string };
};

export async function extractTenant(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
  // Extract troop from subdomain or header
  const troopSlug = c.req.header("x-troop-slug") || c.req.param("troopSlug");

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

    c.set("troop", troop);
    await next();
  } catch (error) {
    return c.json({ error: "Failed to identify troop" }, 500);
  }
}
```

### Repository Pattern for Data Access

```typescript
// repositories/ItemRepository.ts
import { db } from "@/db";
import { items, transactions } from "@/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import type {
  CreateItemData,
  UpdateItemData,
  ItemFilters,
} from "@/types/inventory";

export class ItemRepository {
  async findByTroop(troopId: string, filters?: ItemFilters) {
    let query = db.select().from(items).where(eq(items.troopId, troopId));

    if (filters?.category) {
      query = query.where(
        and(eq(items.troopId, troopId), eq(items.category, filters.category))
      );
    }

    if (filters?.status) {
      query = query.where(
        and(eq(items.troopId, troopId), eq(items.status, filters.status))
      );
    }

    if (filters?.location) {
      const [side, level] = filters.location.split("-");
      query = query.where(
        and(
          eq(items.troopId, troopId),
          eq(items.locationSide, side),
          eq(items.locationLevel, level)
        )
      );
    }

    if (filters?.search) {
      query = query.where(
        and(
          eq(items.troopId, troopId),
          or(
            like(items.name, `%${filters.search}%`),
            like(items.description, `%${filters.search}%`)
          )
        )
      );
    }

    return query.execute();
  }

  async findByQRCode(troopId: string, qrCode: string) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.troopId, troopId), eq(items.qrCode, qrCode)))
      .limit(1);

    return item || null;
  }

  async create(troopId: string, data: CreateItemData) {
    const qrCode = this.generateQRCode();

    const [item] = await db
      .insert(items)
      .values({
        ...data,
        troopId,
        qrCode,
      })
      .returning();

    return item;
  }

  async update(troopId: string, itemId: string, data: UpdateItemData) {
    const [item] = await db
      .update(items)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(items.troopId, troopId), eq(items.id, itemId)))
      .returning();

    return item;
  }

  async checkout(troopId: string, itemId: string, checkoutData: CheckoutData) {
    return db.transaction(async (tx) => {
      // Update item status
      const [item] = await tx
        .update(items)
        .set({
          status: "checked_out",
          updatedAt: new Date(),
        })
        .where(and(eq(items.troopId, troopId), eq(items.id, itemId)))
        .returning();

      // Log transaction
      await tx.insert(transactions).values({
        troopId,
        itemId,
        userId: checkoutData.userId || null,
        action: "check_out",
        checkedOutBy: checkoutData.checkedOutBy,
        expectedReturnDate: checkoutData.expectedReturnDate,
        notes: checkoutData.notes,
      });

      return item;
    });
  }

  private generateQRCode(): string {
    return `QM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### API Route Structure

```typescript
// routes/items.ts
import { Hono } from "hono";
import { ItemRepository } from "@/repositories/ItemRepository";
import { authenticate, authorize } from "@/middleware/auth";
import { extractTenant } from "@/middleware/tenant";
import { validator } from "hono/validator";
import { createItemSchema, updateItemSchema } from "@/lib/validation";

type Variables = {
  troop: { id: string; name: string; slug: string };
  user: { id: string; role: string; troopId: string };
};

const app = new Hono<{ Variables: Variables }>();
const itemRepo = new ItemRepository();

// All routes require tenant extraction
app.use("*", extractTenant);

// GET /api/items - List items with filters
app.get("/", authenticate, async (c) => {
  try {
    const troop = c.get("troop");
    const query = c.req.query();
    const items = await itemRepo.findByTroop(troop.id, query);
    return c.json(items);
  } catch (error) {
    return c.json({ error: "Failed to fetch items" }, 500);
  }
});

// POST /api/items - Create new item (Leader+ only)
app.post(
  "/",
  authenticate,
  authorize(["admin", "leader"]),
  validator("json", (value, c) => {
    const parsed = createItemSchema.safeParse(value);
    if (!parsed.success) {
      return c.json(
        { error: "Invalid input", details: parsed.error.issues },
        400
      );
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const troop = c.get("troop");
      const data = c.req.valid("json");
      const item = await itemRepo.create(troop.id, data);
      return c.json(item, 201);
    } catch (error) {
      return c.json({ error: "Failed to create item" }, 500);
    }
  }
);

// POST /api/items/:id/checkout - Check out item
app.post(
  "/:id/checkout",
  authenticate,
  authorize(["admin", "leader", "scout"]),
  async (c) => {
    try {
      const troop = c.get("troop");
      const itemId = c.req.param("id");
      const data = await c.req.json();
      const item = await itemRepo.checkout(troop.id, itemId, data);
      return c.json(item);
    } catch (error) {
      return c.json({ error: "Failed to check out item" }, 500);
    }
  }
);

export default app;
```

## QR Code Integration

### QR Code Generation Service

```typescript
// services/QRCodeService.ts
import QRCode from "qrcode";
import { items } from "@/db/schema";

export class QRCodeService {
  async generateQRCode(itemId: string, troopSlug: string): Promise<string> {
    const qrData = {
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
        light: "#FEF3C7", // Light yellow
      },
    });
  }

  parseQRCode(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString);

      if (data.type !== "quartermaster_item") {
        return null;
      }

      return {
        itemId: data.itemId,
        troopSlug: data.troopSlug,
        timestamp: data.timestamp,
      };
    } catch {
      return null;
    }
  }

  async generatePrintableLabel(
    itemId: string,
    itemName: string,
    location: string
  ): Promise<Buffer> {
    // Generate PDF label with QR code and item info
    // This would use a PDF generation library like PDFKit
    // Implementation details omitted for brevity
  }
}
```

### Frontend QR Scanner Component

```typescript
// components/scanner/QRScanner.tsx
import { useState } from "react";
import { useQRScanner } from "@/hooks/useQRScanner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onScan: (qrData: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const {
    videoRef,
    isScanning,
    hasPermission,
    error,
    requestPermission,
    startScanning,
    stopScanning,
  } = useQRScanner();

  const handleScan = (result: string) => {
    stopScanning();
    onScan(result);
  };

  if (hasPermission === null) {
    return (
      <Card className="p-6 text-center">
        <Camera className="mx-auto h-12 w-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
        <p className="text-gray-600 mb-4">
          We need access to your camera to scan QR codes
        </p>
        <Button
          onClick={requestPermission}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Allow Camera Access
        </Button>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className="p-6 text-center">
        <X className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
        <p className="text-gray-600 mb-4">
          Please enable camera permissions in your browser settings
        </p>
        <Button variant="outline" onClick={onClose}>
          Close Scanner
        </Button>
      </Card>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full max-w-md mx-auto rounded-lg"
        autoPlay
        playsInline
        muted
      />

      <div className="absolute inset-0 border-2 border-orange-400 rounded-lg pointer-events-none">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-orange-400"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-orange-400"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-orange-400"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-orange-400"></div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {!isScanning ? (
          <Button
            onClick={() => startScanning(handleScan)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="outline">
            Stop Scanning
          </Button>
        )}

        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
    </div>
  );
}
```

## Security & Authentication

### JWT Authentication Strategy

```typescript
// middleware/auth.ts
import jwt from "jsonwebtoken";
import { Context, Next } from "hono";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface JWTPayload {
  userId: string;
  troopId: string;
  role: string;
}

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

export async function authenticate(
  c: Context<{ Variables: Variables }>,
  next: Next
) {
  const token = c.req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Authentication required" }, 401);
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const troop = c.get("troop");

    // Verify user still exists and belongs to the correct troop
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, payload.userId),
          eq(users.troopId, troop?.id || payload.troopId)
        )
      )
      .limit(1);

    if (!user) {
      return c.json({ error: "Invalid token" }, 401);
    }

    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

export function authorize(roles: string[]) {
  return async (c: Context<{ Variables: Variables }>, next: Next) => {
    const user = c.get("user");
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    await next();
  };
}
```

### Input Validation with Zod

```typescript
// lib/validation.ts
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  category: z.enum(["permanent", "staples"]),
  locationSide: z.enum(["left", "right"]),
  locationLevel: z.enum(["low", "middle", "high"]),
});

export const checkoutSchema = z.object({
  userId: z.string().uuid().optional(),
  checkedOutBy: z.string().min(1, "Person checking out is required"),
  expectedReturnDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  troopSlug: z.string().min(1, "Troop identifier is required"),
});
```

## Project Structure

```
quartermaster-app/
├── packages/
│   ├── frontend/                 # React application
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── lib/
│   │   │   ├── types/
│   │   │   └── App.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   │
│   ├── backend/                  # Hono API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts
│   │   │   │   ├── relations.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   └── server.ts
│   │   ├── drizzle/              # Database migrations
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                   # Shared types and utilities
│       ├── src/
│       │   ├── types/
│       │   └── validation/
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                         # Documentation
├── docker-compose.yml           # Local development
├── package.json                 # Root package.json
├── turbo.json                   # Turborepo configuration
└── README.md
```

## Development Workflow

### Getting Started

1. **Environment Setup**

   ```bash
   # Clone and install dependencies
   git clone <repo-url>
   cd quartermaster-app
   npm install

   # Set up environment variables
   cp packages/backend/.env.example packages/backend/.env
   # Edit .env with your configuration

   # Initialize database
   cd packages/backend
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

2. **Development Server**

   ```bash
   # Start both frontend and backend
   npm run dev

   # Or separately:
   npm run dev:frontend  # http://localhost:5173
   npm run dev:backend   # http://localhost:3000
   ```

### Database Management

```bash
# Generate new migration
npm run db:generate

# Run migrations
npm run db:migrate

# Reset database (dev only)
npm run db:reset

# Seed database with sample data
npm run db:seed
```

### Testing Strategy

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Build & Deployment

```bash
# Build for production
npm run build

# Build specific package
npm run build --filter=frontend
npm run build --filter=backend

# Docker build
docker-compose build

# Deploy (environment specific)
npm run deploy:staging
npm run deploy:production
```

---

This design document provides a comprehensive blueprint for implementing the Quarter Master Inventory App with TypeScript, React, shadcn/ui, Hono, Drizzle ORM, and SQLite. The architecture supports multi-tenancy, role-based access control, camera-based QR scanning, and all the features specified in the original requirements.

The modular structure allows for iterative development, starting with core functionality and expanding to advanced features in subsequent phases.

### Hono App Structure

```typescript
// packages/backend/src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import authRoutes from "./routes/auth";
import itemRoutes from "./routes/items";
import userRoutes from "./routes/users";
import qrRoutes from "./routes/qr";

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
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://your-frontend-domain.com"],
    credentials: true,
  })
);

// Health check
app.get("/", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/items", itemRoutes);
app.route("/api/users", userRoutes);
app.route("/api/qr", qrRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
```
