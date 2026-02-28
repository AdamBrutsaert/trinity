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

export const productsTable = pgTable(
	"products",
	(t) => ({
		id: t.uuid("id").defaultRandom().primaryKey(),

		// Product information
		barcode: t.varchar("barcode", { length: 50 }).notNull().unique(),
		name: t.varchar("name", { length: 255 }).notNull(),
		description: t.text("description"),
		imageUrl: t.text("image_url"),
		brandId: t
			.uuid("brand_id")
			.references(() => brandsTable.id, { onDelete: "cascade" })
			.notNull(),
		categoryId: t
			.uuid("category_id")
			.references(() => categoriesTable.id, { onDelete: "cascade" })
			.notNull(),

		// Pricing
		price: t.numeric("price", { precision: 10, scale: 2 }).notNull(),

		// Nutritional information
		energyKcal: t.integer("energy_kcal"),
		fat: t.real("fat"),
		carbs: t.real("carbs"),
		protein: t.real("protein"),
		salt: t.real("salt"),

		// Timestamps
		createdAt: t.timestamp("created_at").defaultNow().notNull(),
		updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
	}),
	(t) => [uniqueIndex("idx_unique_barcode").on(t.barcode)],
);

export const cartItemsTable = pgTable(
	"cart_items",
	(t) => ({
		id: t.uuid("id").defaultRandom().primaryKey(),
		userId: t
			.uuid("user_id")
			.references(() => usersTable.id, { onDelete: "cascade" })
			.notNull(),
		productId: t
			.uuid("product_id")
			.references(() => productsTable.id, { onDelete: "cascade" })
			.notNull(),
		quantity: t.integer("quantity").notNull(),
		createdAt: t.timestamp("created_at").defaultNow().notNull(),
		updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
	}),
	(t) => [uniqueIndex("idx_unique_user_product").on(t.userId, t.productId)],
);

export const invoiceStatusEnum = pgEnum("invoice_status", [
	"pending",
	"completed",
]);

export const invoicesTable = pgTable("invoices", (t) => ({
	id: t.uuid("id").defaultRandom().primaryKey(),
	userId: t
		.uuid("user_id")
		.references(() => usersTable.id, { onDelete: "cascade" })
		.notNull(),
	paypalOrderId: t.varchar("paypal_order_id", { length: 255 }).notNull(),
	status: invoiceStatusEnum("status").default("pending").notNull(),
	totalAmount: t.numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
	createdAt: t.timestamp("created_at").defaultNow().notNull(),
	updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}));

export const invoiceItemsTable = pgTable("invoice_items", (t) => ({
	id: t.uuid("id").defaultRandom().primaryKey(),
	invoiceId: t
		.uuid("invoice_id")
		.references(() => invoicesTable.id, { onDelete: "cascade" })
		.notNull(),
	productId: t
		.uuid("product_id")
		.references(() => productsTable.id, { onDelete: "cascade" })
		.notNull(),
	productName: t.varchar("product_name", { length: 255 }).notNull(),
	unitPrice: t.numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
	quantity: t.integer("quantity").notNull(),
	createdAt: t.timestamp("created_at").defaultNow().notNull(),
}));
