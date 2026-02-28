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
import { createInvoice } from "../invoices/service";
import { createProduct } from "../products/service";
import { createUser } from "../users/service";
import { createReportsModule } from ".";

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
	await createUser(tx, {
		email,
		password: "customerpassword",
		firstName: "Customer",
		lastName: "User",
		role: "customer",
	});

	return (
		await login(tx, {
			email,
			password: "customerpassword",
		})
	)._unsafeUnwrap().token;
}

async function createTestProduct(
	tx: Database,
	name: string,
	price: number,
	barcode: string,
) {
	const uniqueSuffix = `${barcode}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	const brand = await createBrand(tx, `Brand-${uniqueSuffix}`);
	const category = await createCategory(tx, `Category-${uniqueSuffix}`);

	return await createProduct(tx, {
		barcode,
		name,
		price,
		brandId: brand._unsafeUnwrap().id,
		categoryId: category._unsafeUnwrap().id,
		description: null,
		energyKcal: null,
		fat: null,
		carbs: null,
		protein: null,
		salt: null,
		imageUrl: null,
	});
}

describe("Reports module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createReportsModule>>>;

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
		api = treaty(createReportsModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.reports.get();
			expect(response.status).toBe(401);
		});

		it("should return 403 for customer requests", async () => {
			const customerToken = await createCustomerUser(
				connection,
				"customer@example.com",
			);

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(403);
		});

		it("should return reports with no data for empty database", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data?.totalRevenue).toBe(0);
			expect(response.data?.totalOrders).toBe(0);
			expect(response.data?.completedOrders).toBe(0);
			expect(response.data?.pendingOrders).toBe(0);
			expect(response.data?.totalCustomers).toBe(0);
			expect(response.data?.averageOrderValue).toBe(0);
			expect(response.data?.topProducts).toEqual([]);
		});

		it("should return correct reports with invoices and products", async () => {
			const adminToken = await createAdminUser(connection);

			// Create customers
			await createCustomerUser(connection, "customer1@example.com");
			await createCustomerUser(connection, "customer2@example.com");

			// Get customer IDs
		const users = await connection.query.usersTable.findMany({
			});

			// biome-ignore lint/style/noNonNullAssertion: users are created in test setup above
			const customer1Id = users[0]!.id;
			// biome-ignore lint/style/noNonNullAssertion: users are created in test setup above
			const customer2Id = users[1]!.id;

			// Create products
			const product1 = await createTestProduct(
				connection,
				"Product 1",
				10.0,
				"BARCODE1",
			);
			const product2 = await createTestProduct(
				connection,
				"Product 2",
				20.0,
				"BARCODE2",
			);
			const product3 = await createTestProduct(
				connection,
				"Product 3",
				15.0,
				"BARCODE3",
			);

			const product1Id = product1._unsafeUnwrap().id;
			const product2Id = product2._unsafeUnwrap().id;
			const product3Id = product3._unsafeUnwrap().id;

			// Create completed invoices
			await createInvoice(connection, {
				userId: customer1Id,
				paypalOrderId: "PAYPAL-ORDER-1",
				status: "completed",
				totalAmount: "40.00",
				items: [
					{
						productId: product1Id,
						productName: "Product 1",
						unitPrice: "10.00",
						quantity: 2,
					},
					{
						productId: product2Id,
						productName: "Product 2",
						unitPrice: "20.00",
						quantity: 1,
					},
				],
			});

			await createInvoice(connection, {
				userId: customer2Id,
				paypalOrderId: "PAYPAL-ORDER-2",
				status: "completed",
				totalAmount: "80.00",
				items: [
					{
						productId: product1Id,
						productName: "Product 1",
						unitPrice: "10.00",
						quantity: 5,
					},
					{
						productId: product3Id,
						productName: "Product 3",
						unitPrice: "15.00",
						quantity: 2,
					},
				],
			});

			// Create pending invoice
			await createInvoice(connection, {
				userId: customer1Id,
				paypalOrderId: "PAYPAL-ORDER-3",
				status: "pending",
				totalAmount: "60.00",
				items: [
					{
						productId: product2Id,
						productName: "Product 2",
						unitPrice: "20.00",
						quantity: 3,
					},
				],
			});

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);

			// Total revenue = (10*2 + 20*1) + (10*5 + 15*2) = 40 + 80 = 120
			expect(response.data?.totalRevenue).toBe(120);
			expect(response.data?.totalOrders).toBe(3);
			expect(response.data?.completedOrders).toBe(2);
			expect(response.data?.pendingOrders).toBe(1);
			expect(response.data?.totalCustomers).toBe(2);
			expect(response.data?.averageOrderValue).toBe(60); // 120 / 2

			// Top products by quantity
			// Product 1: 2 + 5 = 7 units
			// Product 2: 1 unit (pending not counted)
			// Product 3: 2 units
			expect(response.data?.topProducts).toHaveLength(3);
			expect(response.data?.topProducts[0]).toEqual({
				productId: product1Id,
				productName: "Product 1",
				totalQuantity: 7,
				totalRevenue: 70,
			});
			expect(response.data?.topProducts[1]).toEqual({
				productId: product3Id,
				productName: "Product 3",
				totalQuantity: 2,
				totalRevenue: 30,
			});
			expect(response.data?.topProducts[2]).toEqual({
				productId: product2Id,
				productName: "Product 2",
				totalQuantity: 1,
				totalRevenue: 20,
			});
		});

		it("should only count completed invoices in revenue calculations", async () => {
			const adminToken = await createAdminUser(connection);
			await createCustomerUser(connection, "customer@example.com");

			
			const users = await connection.query.usersTable.findMany({
				where: (usersTable, { eq }) => eq(usersTable.role, "customer"),
			});

			// biome-ignore lint/style/noNonNullAssertion: customer user is created in test setup above
			const customerId = users[0]!.id;

			const product = await createTestProduct(
				connection,
				"Test Product",
				50.0,
				"BARCODE-TEST",
			);
			const productId = product._unsafeUnwrap().id;

			// Create pending invoice
			await createInvoice(connection, {
				userId: customerId,
				paypalOrderId: "PAYPAL-PENDING",
				status: "pending",
				totalAmount: "500.00",
				items: [
					{
						productId,
						productName: "Test Product",
						unitPrice: "50.00",
						quantity: 10,
					},
				],
			});

			// Create completed invoice
			await createInvoice(connection, {
				userId: customerId,
				paypalOrderId: "PAYPAL-COMPLETED",
				status: "completed",
				totalAmount: "100.00",
				items: [
					{
						productId,
						productName: "Test Product",
						unitPrice: "50.00",
						quantity: 2,
					},
				],
			});

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data?.totalRevenue).toBe(100); // Only completed: 50 * 2
			expect(response.data?.totalOrders).toBe(2);
			expect(response.data?.completedOrders).toBe(1);
			expect(response.data?.pendingOrders).toBe(1);
			expect(response.data?.averageOrderValue).toBe(100);
			expect(response.data?.topProducts[0]?.totalQuantity).toBe(2); // Only completed
		});

		it("should limit top products to 10 items", async () => {
			const adminToken = await createAdminUser(connection);
			await createCustomerUser(connection, "customer@example.com");

			
			const users = await connection.query.usersTable.findMany({
				where: (usersTable, { eq }) => eq(usersTable.role, "customer"),
			});

			// biome-ignore lint/style/noNonNullAssertion: customer user is created in test setup above
			const customerId = users[0]!.id;

			// Create 15 products
			const products = [];
			for (let i = 1; i <= 15; i++) {
				const product = await createTestProduct(
					connection,
					`Product ${i}`,
					10.0,
					`BARCODE-${i}`,
				);
				products.push(product._unsafeUnwrap().id);
			}

			// Create invoice with all 15 products
			const items = products.map((productId, i) => ({
				productId,
				productName: `Product ${i + 1}`,
				unitPrice: "10.00",
				quantity: 15 - i, // Different quantities so they sort differently
			}));
			const totalAmount = items
				.reduce((sum, item) => sum + 10.0 * item.quantity, 0)
				.toFixed(2);

			await createInvoice(connection, {
				userId: customerId,
				paypalOrderId: "PAYPAL-MANY-PRODUCTS",
				status: "completed",
				totalAmount,
				items,
			});

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data?.topProducts).toHaveLength(10);
			// Should be sorted by quantity descending
			expect(response.data?.topProducts[0]?.totalQuantity).toBe(15);
			expect(response.data?.topProducts[9]?.totalQuantity).toBe(6);
		});

		it("should handle multiple customers correctly", async () => {
			const adminToken = await createAdminUser(connection);

			// Create 5 customers
			for (let i = 1; i <= 5; i++) {
				await createCustomerUser(connection, `customer${i}@example.com`);
			}

			const response = await api.reports.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data?.totalCustomers).toBe(5);
		});
	});
});
