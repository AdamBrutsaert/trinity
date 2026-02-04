import { pgEnum, pgTable, uniqueIndex } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["customer", "admin"]);

export const usersTable = pgTable(
	"users",
	(t) => ({
		id: t.uuid("id").defaultRandom().primaryKey(),

		// Login information
		email: t.varchar("email", { length: 255 }).notNull().unique(),
		passwordHash: t.varchar("password_hash", { length: 255 }).notNull(),

		// Profile information
		firstName: t.varchar("first_name", { length: 100 }).notNull(),
		lastName: t.varchar("last_name", { length: 100 }).notNull(),
		phoneNumber: t.varchar("phone_number", { length: 30 }),

		// Billing information
		address: t.text("address"),
		zipCode: t.varchar("zip_code", { length: 20 }),
		city: t.varchar("city", { length: 100 }),
		country: t.varchar("country", { length: 100 }),

		// Role and status
		role: rolesEnum("role").default("customer").notNull(),
		isActive: t.boolean("is_active").notNull().default(true),

		// Timestamps
		createdAt: t.timestamp("created_at").defaultNow().notNull(),
		updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
	}),
	(t) => [uniqueIndex("idx_unique_email").on(t.email)],
);
