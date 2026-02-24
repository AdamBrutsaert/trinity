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

export const brandsTable = pgTable("brands", (t) => ({
	id: t.uuid("id").defaultRandom().primaryKey(),
	name: t.varchar("name", { length: 255 }).notNull().unique(),
	createdAt: t.timestamp("created_at").defaultNow().notNull(),
	updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}));

export const categoriesTable = pgTable("categories", (t) => ({
	id: t.uuid("id").defaultRandom().primaryKey(),
	name: t.varchar("name", { length: 255 }).notNull().unique(),
	createdAt: t.timestamp("created_at").defaultNow().notNull(),
	updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}));

export const productsTable = pgTable("products", (t) => ({
	id: t.uuid("id").defaultRandom().primaryKey(),

	// Product information
	barcode: t.varchar("barcode", { length: 50 }).notNull().unique(),
	name: t.varchar("name", { length: 255 }).notNull(),
	description: t.text("description"),
	imageUrl: t.text("image_url"),
	brandId: t
		.uuid("brand_id")
		.references(() => brandsTable.id)
		.notNull(),
	categoryId: t
		.uuid("category_id")
		.references(() => categoriesTable.id)
		.notNull(),

	// Nutritional information
	energyKcal: t.integer("energy_kcal"),
	fat: t.real("fat"),
	carbs: t.real("carbs"),
	protein: t.real("protein"),
	salt: t.real("salt"),

	// Timestamps
	createdAt: t.timestamp("created_at").defaultNow().notNull(),
	updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}), (t) => [uniqueIndex("idx_unique_barcode").on(t.barcode)]);
