import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, troops, users, items, transactions } from "./index";

async function seedDatabase() {
  console.log("Seeding database with sample data...");

  try {
    // Create sample troop
    const [troop] = await db
      .insert(troops)
      .values({
        name: "Troop 123 Eagle Scouts",
        slug: "troop-123",
      })
      .returning();

    console.log("✅ Created sample troop:", troop.name);

    // Create sample users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const sampleUsers = [
      {
        troopId: troop.id,
        username: "admin",
        email: "admin@troop123.org",
        passwordHash: hashedPassword,
        role: "admin" as const,
      },
      {
        troopId: troop.id,
        username: "leader1",
        email: "leader@troop123.org",
        passwordHash: hashedPassword,
        role: "leader" as const,
      },
      {
        troopId: troop.id,
        username: "scout1",
        email: "scout@troop123.org",
        passwordHash: hashedPassword,
        role: "scout" as const,
      },
      {
        troopId: troop.id,
        username: "viewer",
        email: "viewer@troop123.org",
        passwordHash: hashedPassword,
        role: "viewer" as const,
      },
    ];

    const createdUsers = await db.insert(users).values(sampleUsers).returning();
    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create sample items
    const sampleItems = [
      {
        troopId: troop.id,
        name: "4-Person Tent",
        description: "Coleman 4-person camping tent with rainfly",
        category: "permanent" as const,
        locationSide: "left" as const,
        locationLevel: "high" as const,
        qrCode: `QM-${Date.now()}-TENT001`,
      },
      {
        troopId: troop.id,
        name: "Camping Stove",
        description: "Coleman dual-burner propane stove",
        category: "permanent" as const,
        locationSide: "right" as const,
        locationLevel: "middle" as const,
        qrCode: `QM-${Date.now()}-STOVE001`,
      },
      {
        troopId: troop.id,
        name: "Water Jug - 5 Gallon",
        description: "Blue plastic water container with spigot",
        category: "permanent" as const,
        locationSide: "left" as const,
        locationLevel: "low" as const,
        qrCode: `QM-${Date.now()}-WATER001`,
      },
      {
        troopId: troop.id,
        name: "Rope - 50ft",
        description: "Climbing rope for outdoor activities",
        category: "permanent" as const,
        locationSide: "right" as const,
        locationLevel: "high" as const,
        qrCode: `QM-${Date.now()}-ROPE001`,
      },
      {
        troopId: troop.id,
        name: "Paper Plates",
        description: "Disposable plates for camping meals",
        category: "staples" as const,
        locationSide: "left" as const,
        locationLevel: "middle" as const,
        qrCode: `QM-${Date.now()}-PLATES001`,
      },
      {
        troopId: troop.id,
        name: "Toilet Paper",
        description: "Essential camping supplies",
        category: "staples" as const,
        locationSide: "right" as const,
        locationLevel: "low" as const,
        qrCode: `QM-${Date.now()}-TP001`,
      },
    ];

    const createdItems = await db.insert(items).values(sampleItems).returning();
    console.log(`✅ Created ${createdItems.length} sample items`);

    // Create some sample transactions
    const scoutUser = createdUsers.find(u => u.role === "scout");
    const tentItem = createdItems.find(i => i.name === "4-Person Tent");
    
    if (scoutUser && tentItem) {
      await db.insert(transactions).values({
        troopId: troop.id,
        itemId: tentItem.id,
        userId: scoutUser.id,
        action: "check_out",
        checkedOutBy: scoutUser.username,
        notes: "For weekend camping trip",
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      });

      // Update item status
      await db
        .update(items)
        .set({ status: "checked_out" })
        .where(eq(items.id, tentItem.id));

      console.log("✅ Created sample transaction (tent checkout)");
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log("\nSample login credentials:");
    console.log("Admin: admin@troop123.org / password123");
    console.log("Leader: leader@troop123.org / password123");
    console.log("Scout: scout@troop123.org / password123");
    console.log("Viewer: viewer@troop123.org / password123");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}