import { login } from "@trinity/api/auth";
import {
	brandsTable,
	categoriesTable,
	createDatabaseConnection,
	type Database,
	productsTable,
} from "@trinity/api/db";
import { createUser, getUsers } from "@trinity/api/users";

const env = {
	DATABASE_URL: process.env.DATABASE_URL || "",
	JWT_SECRET: process.env.JWT_SECRET || "",
	ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
	ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
	ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME || "",
	ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || "",
};

interface OpenFoodFactsProduct {
	code?: string;
	product_name?: string;
	brands?: string;
	categories?: string;
	"energy-kcal_100g"?: number;
	fat_100g?: number;
	carbohydrates_100g?: number;
	proteins_100g?: number;
	salt_100g?: number;
	image_url?: string;
}

interface OpenFoodFactsResponse {
	products?: OpenFoodFactsProduct[];
}

interface NormalizedProduct {
	barcode: string;
	name: string;
	imageUrl?: string;
	brand: string;
	category: string;
	energyKcal?: number;
	fat?: number;
	carbohydrates?: number;
	proteins?: number;
	salt?: number;
}

async function fetchProducts(page: number = 1): Promise<OpenFoodFactsResponse> {
	const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
	url.searchParams.set("search_simple", "1");
	url.searchParams.set("action", "process");
	url.searchParams.set("page_size", "50");
	url.searchParams.set("page", page.toString());
	url.searchParams.set("json", "1");
	url.searchParams.set(
		"fields",
		"code,product_name,brands,categories,energy-kcal_100g,fat_100g,carbohydrates_100g,proteins_100g,salt_100g,image_url",
	);

	const response = await fetch(url.toString(), {
		signal: AbortSignal.timeout(30000),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return (await response.json()) as OpenFoodFactsResponse;
}

function normalizeProduct(
	data: OpenFoodFactsProduct,
): NormalizedProduct | null {
	if (!data.code || !data.product_name) {
		return null;
	}

	return {
		barcode: data.code,
		name: data.product_name,
		imageUrl: data.image_url,
		brand: (data.brands || "").split(",")[0]?.trim() || "Unknown",
		category: (data.categories || "").split(",")[0]?.trim() || "Unknown",
		energyKcal: data["energy-kcal_100g"],
		fat: data.fat_100g,
		carbohydrates: data.carbohydrates_100g,
		proteins: data.proteins_100g,
		salt: data.salt_100g,
	};
}

async function upsertBrand(db: Database, name: string): Promise<string> {
	const [result] = await db
		.insert(brandsTable)
		.values({ name })
		.onConflictDoUpdate({
			target: brandsTable.name,
			set: {
				updatedAt: new Date(),
			},
		})
		.returning({ id: brandsTable.id });

	if (!result) {
		throw new Error(`Failed to upsert brand: ${name}`);
	}

	return result.id;
}

async function upsertCategory(db: Database, name: string): Promise<string> {
	const [result] = await db
		.insert(categoriesTable)
		.values({ name })
		.onConflictDoUpdate({
			target: categoriesTable.name,
			set: {
				updatedAt: new Date(),
			},
		})
		.returning({ id: categoriesTable.id });

	if (!result) {
		throw new Error(`Failed to upsert category: ${name}`);
	}

	return result.id;
}

async function upsertProduct(
	db: Database,
	product: NormalizedProduct,
	brandId: string,
	categoryId: string,
): Promise<void> {
	const price = Math.random() * 10 + 0.99;

	await db
		.insert(productsTable)
		.values({
			barcode: product.barcode,
			name: product.name,
			price: price.toFixed(2),
			imageUrl: product.imageUrl,
			brandId,
			categoryId,
			energyKcal: product.energyKcal,
			fat: product.fat,
			carbs: product.carbohydrates,
			protein: product.proteins,
			salt: product.salt,
		})
		.onConflictDoUpdate({
			target: productsTable.barcode,
			set: {
				name: product.name,
				imageUrl: product.imageUrl,
				brandId: brandId,
				categoryId: categoryId,
				energyKcal: product.energyKcal,
				fat: product.fat,
				carbs: product.carbohydrates,
				protein: product.proteins,
				salt: product.salt,
				updatedAt: new Date(),
			},
		});
}

async function createAdminUser(db: Database) {
	const email = env.ADMIN_EMAIL;
	const password = env.ADMIN_PASSWORD;
	const firstName = env.ADMIN_FIRST_NAME;
	const lastName = env.ADMIN_LAST_NAME;

	const users = await getUsers(db).unwrapOr([]);
	const existingAdmin = users.find((user) => user.email === email);

	if (!existingAdmin) {
		await createUser(db, {
			email,
			password,
			firstName,
			lastName,
			role: "admin",
		});
	}

	return await login(db, { email, password });
}

async function main() {
	if (!process.env.DATABASE_URL) {
		console.error("Error: DATABASE_URL environment variable is required");
		process.exit(1);
	}

	const db = createDatabaseConnection(process.env.DATABASE_URL);

	// Create admin user
	console.log("Creating admin user...");
	const result = await createAdminUser(db);
	result.match(
		(token) => console.log("✓ Admin token: ", token, "\n"),
		(error) => {
			console.error("Failed to create admin user:", error);
			process.exit(1);
		},
	);

	console.log("Starting Open Food Facts data import...");

	for (let i = 1; i <= 10; i++) {
		console.log(`Fetching page ${i}...`);

		// Be nice to the API
		if (i > 1) {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		const data = await fetchProducts(i);
		const products = (data.products || [])
			.map(normalizeProduct)
			.filter((p): p is NormalizedProduct => p !== null);

		console.log(`Processing ${products.length} products...`);

		for (const product of products) {
			try {
				const brandId = await upsertBrand(db, product.brand);
				const categoryId = await upsertCategory(db, product.category);
				await upsertProduct(db, product, brandId, categoryId);
			} catch (error) {
				console.error(`Failed to import product ${product.barcode}: ${error}`);
			}
		}

		console.log(`✓ Imported ${products.length} products from page ${i}`);
	}

	console.log("\n✓ Import completed successfully!");
}

main().catch((error) => {
	console.error("Fatal error during import:", error);
	console.error(
		"If this is a network error, you may want to try running the script again later.",
	);
	process.exit(1);
});
