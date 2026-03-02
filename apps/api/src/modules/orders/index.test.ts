import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import { SQL } from "bun";

// Set environment variables before importing modules that depend on them
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long";
process.env.PAYPAL_CLIENT_ID = "test-paypal-client-id";
process.env.PAYPAL_CLIENT_SECRET = "test-paypal-client-secret";
process.env.PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com";

import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Wait } from "testcontainers";

import { treaty } from "@elysiajs/eden";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

import { login } from "../auth/service";
import { createBrand } from "../brands/service";
import { createCategory } from "../categories/service";
import {
	createDatabaseConnection,
	createDatabasePlugin,
	type Database,
} from "../database";
import {
	cartItemsTable,
	invoiceItemsTable,
	invoicesTable,
} from "../database/schema";
import { createProduct } from "../products/service";
import { createUser } from "../users/service";
import { createOrdersModule } from ".";

async function createCustomerUser(tx: Database) {
	await createUser(tx, {
		email: "customer@example.com",
		password: "customerpassword",
		firstName: "Customer",
		lastName: "User",
		role: "customer",
	});

	return (
		await login(tx, {
			email: "customer@example.com",
			password: "customerpassword",
		})
	)._unsafeUnwrap().token;
}

async function createTestProduct(
	tx: Database,
	barcode: string,
	name: string,
	price: number,
	brandName: string = "Test Brand",
	categoryName: string = "Test Category",
) {
	const brandResult = await createBrand(tx, brandName);
	const brand = brandResult.isOk()
		? brandResult.value
		: // biome-ignore lint/style/noNonNullAssertion: Brand must exist if createBrand failed with name_already_exists
			(await tx.query.brandsTable.findFirst({
				where: (table, { eq }) => eq(table.name, brandName),
			}))!;

	const categoryResult = await createCategory(tx, categoryName);
	const category = categoryResult.isOk()
		? categoryResult.value
		: // biome-ignore lint/style/noNonNullAssertion: Category must exist if createCategory failed with name_already_exists
			(await tx.query.categoriesTable.findFirst({
				where: (table, { eq }) => eq(table.name, categoryName),
			}))!;

	const product = (
		await createProduct(tx, {
			barcode,
			name,
			description: `Test Description for ${name}`,
			imageUrl: "https://example.com/image.jpg",
			brandId: brand.id,
			categoryId: category.id,
			price,
			energyKcal: 100,
			fat: 10,
			carbs: 20,
			protein: 5,
			salt: 1,
		})
	)._unsafeUnwrap();

	return product;
}

async function addItemToCart(
	tx: Database,
	userId: string,
	productId: string,
	quantity: number,
) {
	await tx.insert(cartItemsTable).values({
		userId,
		productId,
		quantity,
	});
}

describe("Orders module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createOrdersModule>>>;

	// Mock fetch for PayPal API calls
	const originalFetch = global.fetch;

	beforeAll(async () => {
		container = await new PostgreSqlContainer(
			"postgres@sha256:c2820d612da95f7e03f07785878a4de220a53aaaeea351f0f2fa0a4a72ec4e50",
		)
			.withDatabase("postgres")
			.withExposedPorts(5432)
			.withWaitStrategy(Wait.forHealthCheck())
			.start();

		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`CREATE DATABASE db`;
		await admin.close();

		const connection = new SQL({
			url: `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/db`,
		});
		const db = drizzle(connection);
		await migrate(db, { migrationsFolder: "drizzle" });
		await connection.close();
	});

	afterAll(async () => {
		await container.stop();
		global.fetch = originalFetch;
	});

	beforeEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`CREATE DATABASE db_test TEMPLATE db`;
		await admin.close();

		connection = createDatabaseConnection(
			`postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/db_test`,
		);
		api = treaty(createOrdersModule(createDatabasePlugin(connection)));

		// Mock PayPal API
		// biome-ignore lint/suspicious/noExplicitAny: Mock function accepts varied options types, cast needed for global.fetch compatibility
		global.fetch = mock(async (url: string | URL | Request, _options?: any) => {
			const urlString = typeof url === "string" ? url : url.toString();

			// Mock OAuth token request
			if (urlString.includes("/v1/oauth2/token")) {
				return new Response(
					JSON.stringify({
						access_token: "mock_access_token",
					}),
					{ status: 200 },
				);
			}

			// Mock capture order request (must be checked before create)
			if (
				urlString.includes("/v2/checkout/orders") &&
				urlString.endsWith("/capture")
			) {
				return new Response(
					JSON.stringify({
						id: "MOCK_PAYPAL_ORDER_ID",
						status: "COMPLETED",
					}),
					{ status: 201 },
				);
			}

			// Mock create order request
			if (urlString.includes("/v2/checkout/orders")) {
				return new Response(
					JSON.stringify({
						id: "MOCK_PAYPAL_ORDER_ID",
						status: "CREATED",
						links: [
							{
								href: "https://www.sandbox.paypal.com/checkoutnow?token=MOCK_PAYPAL_ORDER_ID",
								rel: "approve",
								method: "GET",
							},
						],
					}),
					{ status: 201 },
				);
			}

			return new Response("Not Found", { status: 404 });
			// biome-ignore lint/suspicious/noExplicitAny: Type cast required for global.fetch mock compatibility
		}) as any;
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
		global.fetch = originalFetch;
	});

	describe("POST /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.orders.post({});
			expect(response.status).toBe(401);
		});

		it("should return 400 for empty cart", async () => {
			const customerToken = await createCustomerUser(connection);

			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(400);
			// Note: Elysia may not populate response.data for 400 status
			// The important thing is that the status is correct
		});

		it("should create an order with invoice and invoice items", async () => {
			const customerToken = await createCustomerUser(connection);
			const product1 = await createTestProduct(
				connection,
				"1234567890123",
				"Product 1",
				10.99,
			);
			const product2 = await createTestProduct(
				connection,
				"9876543210123",
				"Product 2",
				25.5,
			);

			// Get userId from token
			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;

			// Add items to cart
			await addItemToCart(connection, userId, product1.id, 2);
			await addItemToCart(connection, userId, product2.id, 3);

			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty("orderId", "MOCK_PAYPAL_ORDER_ID");
			expect(response.data).toHaveProperty(
				"approvalUrl",
				"https://www.sandbox.paypal.com/checkoutnow?token=MOCK_PAYPAL_ORDER_ID",
			);

			// Verify invoice was created
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));

			expect(invoices).toHaveLength(1);
			expect(invoices[0]).toMatchObject({
				userId,
				paypalOrderId: "MOCK_PAYPAL_ORDER_ID",
				status: "pending",
				totalAmount: "98.48", // 2 * 10.99 + 3 * 25.5
			});

			// Verify invoice items were created
			const invoiceItems = await connection
				.select()
				.from(invoiceItemsTable)
				// biome-ignore lint/style/noNonNullAssertion: Invoice was just verified to exist with length check
				.where(eq(invoiceItemsTable.invoiceId, invoices[0]!.id));

			expect(invoiceItems).toHaveLength(2);
			expect(invoiceItems).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						productId: product1.id,
						productName: "Product 1",
						unitPrice: "10.99",
						quantity: 2,
					}),
					expect.objectContaining({
						productId: product2.id,
						productName: "Product 2",
						unitPrice: "25.50",
						quantity: 3,
					}),
				]),
			);

			// Verify cart was cleared
			const cartItems = await connection
				.select()
				.from(cartItemsTable)
				.where(eq(cartItemsTable.userId, userId));

			expect(cartItems).toHaveLength(0);
		});

		it("should create invoice with single item", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(
				connection,
				"1234567890123",
				"Single Product",
				15.0,
				"Brand Single",
				"Category Single",
			);

			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;

			await addItemToCart(connection, userId, product.id, 1);

			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(200);

			// Verify invoice
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));

			expect(invoices).toHaveLength(1);
			// biome-ignore lint/style/noNonNullAssertion: Invoice was just verified to exist with length check
			expect(invoices[0]!.totalAmount).toBe("15.00");

			// Verify invoice items
			const invoiceItems = await connection
				.select()
				.from(invoiceItemsTable)
				// biome-ignore lint/style/noNonNullAssertion: Invoice was just verified to exist with length check
				.where(eq(invoiceItemsTable.invoiceId, invoices[0]!.id));

			expect(invoiceItems).toHaveLength(1);
			expect(invoiceItems[0]).toMatchObject({
				productId: product.id,
				productName: "Single Product",
				unitPrice: "15.00",
				quantity: 1,
			});
		});

		it("should handle PayPal API failures", async () => {
			global.fetch = mock(async () => {
				return new Response("Server Error", { status: 500 });
				// biome-ignore lint/suspicious/noExplicitAny: Type cast required for global.fetch mock compatibility
			}) as any;

			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(
				connection,
				"1234567890123",
				"Product",
				10.0,
				"Brand Failure",
				"Category Failure",
			);

			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;

			await addItemToCart(connection, userId, product.id, 1);

			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(502);

			// Verify no invoice was created (transaction should rollback)
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));

			expect(invoices).toHaveLength(0);

			// Verify cart was not cleared
			const cartItems = await connection
				.select()
				.from(cartItemsTable)
				.where(eq(cartItemsTable.userId, userId));

			expect(cartItems).toHaveLength(1);
		});

		it("should only process current user's cart", async () => {
			const customerToken = await createCustomerUser(connection);

			// Create second customer
			await createUser(connection, {
				email: "customer2@example.com",
				password: "customerpassword",
				firstName: "Customer2",
				lastName: "User",
				role: "customer",
			});

			const product1 = await createTestProduct(
				connection,
				"1234567890123",
				"Product 1",
				10.0,
				"Brand Multi",
				"Category Multi",
			);
			const product2 = await createTestProduct(
				connection,
				"9876543210123",
				"Product 2",
				20.0,
				"Brand Multi",
				"Category Multi",
			);

			const users = await connection.query.usersTable.findMany();
			// biome-ignore lint/style/noNonNullAssertion: Users were just created above
			const user1 = users.find((u) => u.email === "customer@example.com")!;
			// biome-ignore lint/style/noNonNullAssertion: Users were just created above
			const user2 = users.find((u) => u.email === "customer2@example.com")!;

			// Add items to both carts
			await addItemToCart(connection, user1.id, product1.id, 2);
			await addItemToCart(connection, user2.id, product2.id, 3);

			// Create order for customer 1
			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(200);

			// Verify customer 1's cart is cleared
			const cart1Items = await connection
				.select()
				.from(cartItemsTable)
				.where(eq(cartItemsTable.userId, user1.id));
			expect(cart1Items).toHaveLength(0);

			// Verify customer 2's cart is still intact
			const cart2Items = await connection
				.select()
				.from(cartItemsTable)
				.where(eq(cartItemsTable.userId, user2.id));
			expect(cart2Items).toHaveLength(1);

			// Verify invoice total matches customer 1's cart
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, user1.id));
			// biome-ignore lint/style/noNonNullAssertion: Invoice was created for user1 above
			expect(invoices[0]!.totalAmount).toBe("20.00"); // 2 * 10.0
		});

		it("should calculate correct total for multiple quantities", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(
				connection,
				"1234567890123",
				"Product",
				7.99,
				"Brand Quantity",
				"Category Quantity",
			);

			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;

			// Add 10 items
			await addItemToCart(connection, userId, product.id, 10);

			const response = await api.orders.post(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(200);

			// Verify invoice total
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));

			// biome-ignore lint/style/noNonNullAssertion: Invoice was just created above
			expect(invoices[0]!.totalAmount).toBe("79.90"); // 10 * 7.99
		});
	});

	describe("POST /:orderId/capture", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api
				.orders({ orderId: "MOCK_PAYPAL_ORDER_ID" })
				.capture.post();
			expect(response.status).toBe(401);
		});

		it("should capture an order and mark the invoice as completed", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(
				connection,
				"1234567890123",
				"Capture Product",
				19.99,
				"Brand Capture",
				"Category Capture",
			);

			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;

			await addItemToCart(connection, userId, product.id, 1);

			// First create the order to get a pending invoice
			const createResponse = await api.orders.post(
				{},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(createResponse.status).toBe(200);

			// Verify invoice is pending
			const pendingInvoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));
			expect(pendingInvoices[0]?.status).toBe("pending");

			// Now capture the order
			const captureResponse = await api
				.orders({ orderId: "MOCK_PAYPAL_ORDER_ID" })
				.capture.post(
					{},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(captureResponse.status).toBe(200);
			expect(captureResponse.data).toHaveProperty(
				"orderId",
				"MOCK_PAYPAL_ORDER_ID",
			);

			// Verify invoice is now completed
			const completedInvoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));

			expect(completedInvoices).toHaveLength(1);
			expect(completedInvoices[0]?.status).toBe("completed");
		});

		it("should return 404 when no invoice matches the provided orderId", async () => {
			const customerToken = await createCustomerUser(connection);

			// Capture a non-existent order — PayPal side mocked as COMPLETED
			// but the DB update will find 0 rows
			const response = await api
				.orders({ orderId: "MOCK_PAYPAL_ORDER_ID" })
				.capture.post(
					{},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(response.status).toBe(404);
		});

		it("should return 502 when PayPal capture returns a non-COMPLETED status", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(
				connection,
				"1234567890123",
				"Capture Fail Product",
				9.99,
				"Brand CaptFail",
				"Category CaptFail",
			);

			const users = await connection.query.usersTable.findMany({
				where: (table, { eq }) => eq(table.email, "customer@example.com"),
			});
			// biome-ignore lint/style/noNonNullAssertion: User was just created in createCustomerUser
			const userId = users[0]!.id;
			await addItemToCart(connection, userId, product.id, 1);

			const createResponse = await api.orders.post(
				{},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(createResponse.status).toBe(200);

			// Override mock to return a non-COMPLETED status for capture
			global.fetch = mock(
				// biome-ignore lint/suspicious/noExplicitAny: Type cast required for global.fetch mock compatibility
				async (url: string | URL | Request, _options?: any) => {
					const urlString = typeof url === "string" ? url : url.toString();
					if (urlString.includes("/v1/oauth2/token")) {
						return new Response(
							JSON.stringify({ access_token: "mock_access_token" }),
							{ status: 200 },
						);
					}
					if (
						urlString.includes("/v2/checkout/orders") &&
						urlString.endsWith("/capture")
					) {
						return new Response(
							JSON.stringify({ id: "MOCK_PAYPAL_ORDER_ID", status: "VOIDED" }),
							{ status: 200 },
						);
					}
					return new Response("Not Found", { status: 404 });
				},
				// biome-ignore lint/suspicious/noExplicitAny: Type cast required for global.fetch mock compatibility
			) as any;

			const captureResponse = await api
				.orders({ orderId: "MOCK_PAYPAL_ORDER_ID" })
				.capture.post(
					{},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(captureResponse.status).toBe(502);

			// Invoice should remain pending
			const invoices = await connection
				.select()
				.from(invoicesTable)
				.where(eq(invoicesTable.userId, userId));
			expect(invoices[0]?.status).toBe("pending");
		});

		it("should return 502 when PayPal access token request fails during capture", async () => {
			const customerToken = await createCustomerUser(connection);

			// Override mock to fail the token endpoint
			global.fetch = mock(async () => {
				return new Response("Internal Server Error", { status: 500 });
				// biome-ignore lint/suspicious/noExplicitAny: Type cast required for global.fetch mock compatibility
			}) as any;

			const response = await api
				.orders({ orderId: "MOCK_PAYPAL_ORDER_ID" })
				.capture.post(
					{},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(response.status).toBe(502);
		});
	});
});
