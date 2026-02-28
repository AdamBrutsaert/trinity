import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";
import { SQL } from "bun";

import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Wait } from "testcontainers";

import { treaty } from "@elysiajs/eden";
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
import { createProduct } from "../products/service";
import { createUser } from "../users/service";
import { createInvoicesModule } from ".";

async function createAdminUser(tx: Database) {
	await createUser(tx, {
		email: "admin@example.com",
		password: "adminpassword",
		firstName: "Admin",
		lastName: "User",
		role: "admin",
	});

	return (
		await login(tx, {
			email: "admin@example.com",
			password: "adminpassword",
		})
	)._unsafeUnwrap().token;
}

async function createCustomerUser(tx: Database, email: string) {
	const result = await createUser(tx, {
		email,
		password: "customerpassword",
		firstName: "Customer",
		lastName: "User",
		role: "customer",
	});

	const user = result._unsafeUnwrap();

	const token = (
		await login(tx, {
			email,
			password: "customerpassword",
		})
	)._unsafeUnwrap().token;

	return { userId: user.id, token };
}

async function setupTestProduct(tx: Database) {
	const brand = (await createBrand(tx, "Test Brand"))._unsafeUnwrap();

	const category = (await createCategory(tx, "Test Category"))._unsafeUnwrap();

	const product = (
		await createProduct(tx, {
			barcode: "1234567890",
			name: "Test Product",
			description: "Test Description",
			brandId: brand.id,
			categoryId: category.id,
			price: 10.0,
		})
	)._unsafeUnwrap();

	return product;
}

describe("Invoices module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createInvoicesModule>>>;

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
	});

	beforeEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`CREATE DATABASE db_test TEMPLATE db`;
		await admin.close();

		connection = createDatabaseConnection(
			`postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/db_test`,
		);
		api = treaty(createInvoicesModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("GET /", () => {
		it("should return 401 or 403 for unauthenticated or customer requests", async () => {
			const response = await api.invoices.get();
			expect(response.status).toBe(401);

			const { token: customerToken } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const customerResponse = await api.invoices.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(customerResponse.status).toBe(403);
		});

		it("should return an empty list when no invoices exist", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.invoices.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toEqual([]);
		});

		it("should return a list of invoices", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create first invoice
			const response1 = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-1",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			// Create second invoice
			const response2 = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-2",
					status: "completed",
					totalAmount: "20.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 2,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			// Get all invoices
			const response = await api.invoices.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			expect(response.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						paypalOrderId: "PAYPAL-ORDER-1",
						status: "pending",
						totalAmount: "10.00",
					}),
					expect.objectContaining({
						paypalOrderId: "PAYPAL-ORDER-2",
						status: "completed",
						totalAmount: "20.00",
					}),
				]),
			);
		});
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer requests", async () => {
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			const response = await api.invoices.post({
				userId,
				paypalOrderId: "PAYPAL-ORDER-1",
				totalAmount: "10.00",
				items: [
					{
						productId: product.id,
						productName: product.name,
						unitPrice: product.price,
						quantity: 1,
					},
				],
			});
			expect(response.status).toBe(401);

			const { token: customerToken } = await createCustomerUser(
				connection,
				"customer2@example.com",
			);
			const customerResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-1",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should create an invoice with items", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			const response = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "25.50",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 2,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data?.userId).toBe(userId);
			expect(response.data?.paypalOrderId).toBe("PAYPAL-ORDER-123");
			expect(response.data?.status).toBe("pending");
			expect(response.data?.totalAmount).toBe("25.50");
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
			expect(response.data?.items).toHaveLength(1);
			expect(response.data?.items[0]).toEqual(
				expect.objectContaining({
					productId: product.id,
					productName: product.name,
					unitPrice: product.price,
					quantity: 2,
				}),
			);
		});

		it("should return 404 for non-existing user", async () => {
			const adminToken = await createAdminUser(connection);
			const product = await setupTestProduct(connection);

			const response = await api.invoices.post(
				{
					userId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					paypalOrderId: "PAYPAL-ORDER-123",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(404);
		});

		it("should return 404 for non-existing product", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);

			const response = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					totalAmount: "10.00",
					items: [
						{
							productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
							productName: "Non-existing Product",
							unitPrice: "10.00",
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(404);
		});

		it("should default to pending status if not provided", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			const response = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data?.status).toBe("pending");
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer requests", async () => {
			const response = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					status: "completed",
				});
			expect(response.status).toBe(401);

			const { token: customerToken } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const customerResponse = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						status: "completed",
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should update an invoice status", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create invoice
			const createResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const invoiceId = createResponse.data!.id;

			// Update invoice
			const updateResponse = await api.invoices({ id: invoiceId }).put(
				{
					status: "completed",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(updateResponse.status).toBe(200);
			expect(updateResponse.data?.status).toBe("completed");
			expect(updateResponse.data?.id).toBe(invoiceId);
		});

		it("should return 404 for non-existing invoice", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						status: "completed",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);

			expect(response.status).toBe(404);
		});
	});

	describe("DELETE /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer requests", async () => {
			const response = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);

			const { token: customerToken } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const customerResponse = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should delete an invoice", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create invoice
			const createResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const invoiceId = createResponse.data!.id;

			// Delete invoice
			const deleteResponse = await api
				.invoices({ id: invoiceId })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });

			expect(deleteResponse.status).toBe(204);

			// Verify invoice is deleted
			const getResponse = await api.invoices.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(getResponse.status).toBe(200);
			expect(getResponse.data).toHaveLength(0);
		});

		it("should return 404 for non-existing invoice", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api
				.invoices({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });

			expect(response.status).toBe(404);
		});

		it("should cascade delete invoice items", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create invoice with multiple items
			const createResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "20.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 2,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const invoiceId = createResponse.data!.id;

			// Delete invoice (should also delete items)
			const deleteResponse = await api
				.invoices({ id: invoiceId })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });

			expect(deleteResponse.status).toBe(204);
		});
	});

	describe("GET /users/:id", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.invoices
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);
		});

		it("should return 403 when customer tries to access another user's invoices", async () => {
			const { token: customerToken } = await createCustomerUser(
				connection,
				"customer1@example.com",
			);
			const { userId: userId2 } = await createCustomerUser(
				connection,
				"customer2@example.com",
			);

			const response = await api.invoices
				.users({ id: userId2 })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });

			expect(response.status).toBe(403);
		});

		it("should allow customer to view their own invoices", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId, token: customerToken } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create invoice for customer
			const createResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			// Customer retrieves their own invoices
			const response = await api.invoices
				.users({ id: userId })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(1);
			expect(response.data?.[0]?.userId).toBe(userId);
			expect(response.data?.[0]?.paypalOrderId).toBe("PAYPAL-ORDER-123");
		});

		it("should allow admin to view any user's invoices", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create invoice
			const createResponse = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-123",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			// Admin retrieves user's invoices
			const response = await api.invoices
				.users({ id: userId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(1);
			expect(response.data?.[0]?.userId).toBe(userId);
		});

		it("should return 404 for non-existing user", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.invoices
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });

			expect(response.status).toBe(404);
		});

		it("should return empty array when user has no invoices", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);

			const response = await api.invoices
				.users({ id: userId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });

			expect(response.status).toBe(200);
			expect(response.data).toEqual([]);
		});

		it("should return invoices ordered by creation date (newest first)", async () => {
			const adminToken = await createAdminUser(connection);
			const { userId } = await createCustomerUser(
				connection,
				"customer@example.com",
			);
			const product = await setupTestProduct(connection);

			// Create first invoice
			const response1 = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-1",
					status: "pending",
					totalAmount: "10.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 1,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			// Create second invoice
			const response2 = await api.invoices.post(
				{
					userId,
					paypalOrderId: "PAYPAL-ORDER-2",
					status: "completed",
					totalAmount: "20.00",
					items: [
						{
							productId: product.id,
							productName: product.name,
							unitPrice: product.price,
							quantity: 2,
						},
					],
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			// Get invoices
			const response = await api.invoices
				.users({ id: userId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			// Newest first
			expect(response.data?.[0]?.paypalOrderId).toBe("PAYPAL-ORDER-2");
			expect(response.data?.[1]?.paypalOrderId).toBe("PAYPAL-ORDER-1");
		});
	});
});
