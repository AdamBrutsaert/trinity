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
import { createCartModule } from ".";

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

async function createSecondCustomerUser(tx: Database) {
	await createUser(tx, {
		email: "customer2@example.com",
		password: "customerpassword",
		firstName: "Customer2",
		lastName: "User",
		role: "customer",
	});

	return (
		await login(tx, {
			email: "customer2@example.com",
			password: "customerpassword",
		})
	)._unsafeUnwrap().token;
}

async function createTestProduct(tx: Database, price = 9.99) {
	const brand = (await createBrand(tx, "Test Brand"))._unsafeUnwrap();
	const category = (await createCategory(tx, "Test Category"))._unsafeUnwrap();

	const product = (
		await createProduct(tx, {
			barcode: "1234567890123",
			name: "Test Product",
			description: "Test Description",
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

async function createSecondTestProduct(tx: Database, price = 19.99) {
	const brand = (await createBrand(tx, "Test Brand 2"))._unsafeUnwrap();
	const category = (
		await createCategory(tx, "Test Category 2")
	)._unsafeUnwrap();

	const product = (
		await createProduct(tx, {
			barcode: "9876543210123",
			name: "Test Product 2",
			description: "Test Description 2",
			imageUrl: "https://example.com/image2.jpg",
			brandId: brand.id,
			categoryId: category.id,
			price,
			energyKcal: 200,
			fat: 15,
			carbs: 30,
			protein: 10,
			salt: 2,
		})
	)._unsafeUnwrap();

	return product;
}

describe("Cart module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createCartModule>>>;

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
		api = treaty(createCartModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /items", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart.items.post({
				productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				quantity: 1,
			});
			expect(response.status).toBe(401);
		});

		it("should add an item to cart", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const response = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data).toHaveProperty("productId", product.id);
			expect(response.data).toHaveProperty("quantity", 2);
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
		});

		it("should update quantity if item already exists in cart", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const response1 = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 5,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(response2.status).toBe(201);
			expect(response2.data).toHaveProperty("quantity", 5);
		});

		it("should return 404 for non-existing product", async () => {
			const customerToken = await createCustomerUser(connection);

			const response = await api.cart.items.post(
				{
					productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			expect(response.status).toBe(404);
		});

		it("should return 422 for invalid quantity", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const response = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 0,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			expect(response.status).toBe(422);
		});
	});

	describe("PUT /items/:productId", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart
				.items({ productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					quantity: 3,
				});
			expect(response.status).toBe(401);
		});

		it("should update cart item quantity", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const addResponse = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(addResponse.status).toBe(201);

			const updateResponse = await api.cart
				.items({ productId: product.id })
				.put(
					{ quantity: 5 },
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(updateResponse.status).toBe(200);
			expect(updateResponse.data).toHaveProperty("quantity", 5);
		});

		it("should return 404 for non-existing cart item", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const response = await api.cart
				.items({ productId: product.id })
				.put(
					{ quantity: 5 },
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			expect(response.status).toBe(404);
		});

		it("should not update other users cart items", async () => {
			const customer1Token = await createCustomerUser(connection);
			const customer2Token = await createSecondCustomerUser(connection);
			const product = await createTestProduct(connection);

			const addResponse = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customer1Token}` } },
			);
			expect(addResponse.status).toBe(201);

			const updateResponse = await api.cart
				.items({ productId: product.id })
				.put(
					{ quantity: 5 },
					{ headers: { Authorization: `Bearer ${customer2Token}` } },
				);

			expect(updateResponse.status).toBe(404);
		});
	});

	describe("DELETE /items/:productId", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart
				.items({ productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);
		});

		it("should remove item from cart", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const addResponse = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(addResponse.status).toBe(201);

			const deleteResponse = await api.cart
				.items({ productId: product.id })
				.delete(
					{},
					{
						headers: { Authorization: `Bearer ${customerToken}` },
					},
				);

			expect(deleteResponse.status).toBe(204);

			const getResponse = await api.cart.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(getResponse.status).toBe(200);
			expect(getResponse.data).toHaveLength(0);
		});

		it("should return 404 for non-existing cart item", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			const response = await api.cart.items({ productId: product.id }).delete(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(response.status).toBe(404);
		});

		it("should not remove other users cart items", async () => {
			const customer1Token = await createCustomerUser(connection);
			const customer2Token = await createSecondCustomerUser(connection);
			const product = await createTestProduct(connection);

			const addResponse = await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customer1Token}` } },
			);
			expect(addResponse.status).toBe(201);

			const deleteResponse = await api.cart
				.items({ productId: product.id })
				.delete(
					{},
					{
						headers: { Authorization: `Bearer ${customer2Token}` },
					},
				);

			expect(deleteResponse.status).toBe(404);

			const getResponse = await api.cart.get({
				headers: { Authorization: `Bearer ${customer1Token}` },
			});
			expect(getResponse.status).toBe(200);
			expect(getResponse.data).toHaveLength(1);
		});
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart.get();
			expect(response.status).toBe(401);
		});

		it("should return empty cart for new user", async () => {
			const customerToken = await createCustomerUser(connection);

			const response = await api.cart.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(0);
		});

		it("should return cart items", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			const response = await api.cart.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(1);
			expect(response.data?.[0]).toHaveProperty("productId", product.id);
			expect(response.data?.[0]).toHaveProperty("quantity", 2);
		});

		it("should only return current users cart items", async () => {
			const customer1Token = await createCustomerUser(connection);
			const customer2Token = await createSecondCustomerUser(connection);
			const product = await createTestProduct(connection);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customer1Token}` } },
			);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 5,
				},
				{ headers: { Authorization: `Bearer ${customer2Token}` } },
			);

			const response1 = await api.cart.get({
				headers: { Authorization: `Bearer ${customer1Token}` },
			});
			expect(response1.status).toBe(200);
			expect(response1.data).toHaveLength(1);
			expect(response1.data?.[0]).toHaveProperty("quantity", 2);

			const response2 = await api.cart.get({
				headers: { Authorization: `Bearer ${customer2Token}` },
			});
			expect(response2.status).toBe(200);
			expect(response2.data).toHaveLength(1);
			expect(response2.data?.[0]).toHaveProperty("quantity", 5);
		});
	});

	describe("DELETE /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart.delete();
			expect(response.status).toBe(401);
		});

		it("should clear cart", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			const clearResponse = await api.cart.delete(
				{},
				{
					headers: { Authorization: `Bearer ${customerToken}` },
				},
			);

			expect(clearResponse.status).toBe(204);

			const getResponse = await api.cart.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(getResponse.status).toBe(200);
			expect(getResponse.data).toHaveLength(0);
		});

		it("should only clear current users cart", async () => {
			const customer1Token = await createCustomerUser(connection);
			const customer2Token = await createSecondCustomerUser(connection);
			const product = await createTestProduct(connection);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customer1Token}` } },
			);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 5,
				},
				{ headers: { Authorization: `Bearer ${customer2Token}` } },
			);

			const clearResponse = await api.cart.delete(
				{},
				{
					headers: { Authorization: `Bearer ${customer1Token}` },
				},
			);
			expect(clearResponse.status).toBe(204);

			const response1 = await api.cart.get({
				headers: { Authorization: `Bearer ${customer1Token}` },
			});
			expect(response1.status).toBe(200);
			expect(response1.data).toHaveLength(0);

			const response2 = await api.cart.get({
				headers: { Authorization: `Bearer ${customer2Token}` },
			});
			expect(response2.status).toBe(200);
			expect(response2.data).toHaveLength(1);
		});
	});

	describe("GET /total", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.cart.total.get();
			expect(response.status).toBe(401);
		});

		it("should return 0 for empty cart", async () => {
			const customerToken = await createCustomerUser(connection);

			const response = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty("total", 0);
		});

		it("should calculate total for single item", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection, 10.5);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 3,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			const response = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty("total", 31.5);
		});

		it("should calculate total for multiple items", async () => {
			const customerToken = await createCustomerUser(connection);
			const product1 = await createTestProduct(connection, 10.99);
			const product2 = await createSecondTestProduct(connection, 25.5);

			await api.cart.items.post(
				{
					productId: product1.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			await api.cart.items.post(
				{
					productId: product2.id,
					quantity: 3,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			const response = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});

			expect(response.status).toBe(200);
			// 2 * 10.99 + 3 * 25.5 = 21.98 + 76.5 = 98.48
			expect(response.data).toHaveProperty("total", 98.48);
		});

		it("should only calculate total for current user's cart", async () => {
			const customer1Token = await createCustomerUser(connection);
			const customer2Token = await createSecondCustomerUser(connection);
			const product1 = await createTestProduct(connection, 15.0);
			const product2 = await createSecondTestProduct(connection, 20.0);

			await api.cart.items.post(
				{
					productId: product1.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customer1Token}` } },
			);

			await api.cart.items.post(
				{
					productId: product2.id,
					quantity: 5,
				},
				{ headers: { Authorization: `Bearer ${customer2Token}` } },
			);

			const response1 = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customer1Token}` },
			});
			expect(response1.status).toBe(200);
			expect(response1.data).toHaveProperty("total", 30.0);

			const response2 = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customer2Token}` },
			});
			expect(response2.status).toBe(200);
			expect(response2.data).toHaveProperty("total", 100.0);
		});

		it("should update total when cart items change", async () => {
			const customerToken = await createCustomerUser(connection);
			const product = await createTestProduct(connection, 12.5);

			await api.cart.items.post(
				{
					productId: product.id,
					quantity: 2,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);

			const response1 = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(response1.status).toBe(200);
			expect(response1.data).toHaveProperty("total", 25.0);

			// Update quantity
			await api.cart
				.items({ productId: product.id })
				.put(
					{ quantity: 5 },
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);

			const response2 = await api.cart.total.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(response2.status).toBe(200);
			expect(response2.data).toHaveProperty("total", 62.5);
		});
	});
});
