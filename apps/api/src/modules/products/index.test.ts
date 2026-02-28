import { SQL } from "bun";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "bun:test";

import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Wait } from "testcontainers";

import { treaty } from "@elysiajs/eden";
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";

import { createProductsModule } from ".";
import { login } from "../auth/service";
import { createBrand } from "../brands/service";
import { createCategory } from "../categories/service";
import {
	createDatabaseConnection,
	createDatabasePlugin,
	type Database,
} from "../database";
import { createUser } from "../users/service";

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

async function createTestCategory(tx: Database) {
	const response = await createCategory(tx, "Test Category");
	return response._unsafeUnwrap().id;
}

async function createTestBrand(tx: Database) {
	const response = await createBrand(tx, "Test Brand");
	return response._unsafeUnwrap().id;
}

describe("Products module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createProductsModule>>>;

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
		api = treaty(createProductsModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer creation requests", async () => {
			const response = await api.products.post({
				barcode: "123456789",
				name: "Test Product",
				description: "Test Description",
				price: 9.99,
				categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
			});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existent category", async () => {
			const adminToken = await createAdminUser(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(404);
		});

		it("should return 404 for non-existent brand", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(404);
		});

		it("should create a product", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);
			expect(response.data).toMatchObject({
				id: expect.any(String),
				barcode: "123456789",
				name: "Test Product",
				description: "Test Description",
				price: 9.99,
				categoryId,
				brandId,
			});
		});

		it("shouldn't create a product with duplicate barcode", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const originalResponse = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(originalResponse.status).toBe(201);

			const duplicateResponse = await api.products.post(
				{
					barcode: "123456789",
					name: "Another Product",
					description: "Another Description",
					price: 14.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(duplicateResponse.status).toBe(409);
		});
	});

	describe("GET /:id", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to find a product", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const productResponse = await api
				.products({ id: productId })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(productResponse.status).toBe(200);
			expect(productResponse.data).toEqual(response.data);
		});

		it("should find an existing product", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const productResponse = await api
				.products({ id: productId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(productResponse.status).toBe(200);
			expect(productResponse.data).toEqual(response.data);
		});

		it("should return 404 for non-existent product", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(404);
		});

		it("should return 422 for invalid product ID", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.products({ id: "invalid-uuid" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(422);
		});
	});

	describe("GET /barcode/:barcode", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.products
				.barcode({ barcode: "123456789" })
				.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to find a product by barcode", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const createResponse = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			const response = await api.products
				.barcode({ barcode: "123456789" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(response.status).toBe(200);
			expect(response.data).toEqual(createResponse.data);
		});

		it("should allow admins to find a product by barcode", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const createResponse = await api.products.post(
				{
					barcode: "987654321",
					name: "Test Product 2",
					description: "Test Description 2",
					price: 12.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(createResponse.status).toBe(201);

			const response = await api.products
				.barcode({ barcode: "987654321" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(200);
			expect(response.data).toEqual(createResponse.data);
		});

		it("should return 404 for non-existent barcode", async () => {
			const customerToken = await createCustomerUser(connection);
			const response = await api.products
				.barcode({ barcode: "nonexistent" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(response.status).toBe(404);
		});

		it("should return the correct product when multiple products exist", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			// Create multiple products
			const response1 = await api.products.post(
				{
					barcode: "111111111",
					name: "Product 1",
					description: "Description 1",
					price: 10.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.products.post(
				{
					barcode: "222222222",
					name: "Product 2",
					description: "Description 2",
					price: 11.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			// Find by first barcode
			const findResponse1 = await api.products
				.barcode({ barcode: "111111111" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(findResponse1.status).toBe(200);
			expect(findResponse1.data).toEqual(response1.data);

			// Find by second barcode
			const findResponse2 = await api.products
				.barcode({ barcode: "222222222" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(findResponse2.status).toBe(200);
			expect(findResponse2.data).toEqual(response2.data);
		});
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.products.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to list products", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response1 = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.products.post(
				{
					barcode: "987654321",
					name: "Test Product 2",
					description: "Test Description 2",
					price: 12.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.products.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
		});

		it("should return a list of products", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response1 = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.products.post(
				{
					barcode: "987654321",
					name: "Test Product 2",
					description: "Test Description 2",
					price: 12.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.products.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			expect(response.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: "Test Product",
					}),
					expect.objectContaining({
						name: "Test Product 2",
					}),
				]),
			);
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer update requests", async () => {
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						barcode: "123456789",
						name: "Test Product",
						description: "Test Description",
						price: 9.99,
						categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
						brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing product", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						barcode: "123456789",
						name: "Test Product",
						description: "Test Description",
						price: 9.99,
						categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
						brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(404);
		});

		it("should return 404 for non-existing category", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const updateResponse = await api.products({ id: productId }).put(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(404);
		});

		it("should return 404 for non-existing brand", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const updateResponse = await api.products({ id: productId }).put(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(404);
		});

		it("should return 409 for barcode already in use by another product", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response1 = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.products.post(
				{
					barcode: "1234567890",
					name: "Another Product",
					description: "Another Description",
					price: 14.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.products({ id: response2.data!.id })
				.put(
					{
						barcode: "123456789", // This barcode is already in use by response1
						name: "Updated Product",
						description: "Updated Description",
						price: 19.99,
						categoryId,
						brandId,
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(409);
		});

		it("should update a product", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const updateResponse = await api.products({ id: productId }).put(
				{
					barcode: "987654321",
					name: "Updated Product",
					description: "Updated Description",
					price: 15.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(200);
			expect(updateResponse.data).toMatchObject({
				id: productId,
				barcode: "987654321",
				name: "Updated Product",
				description: "Updated Description",
				price: 15.99,
				categoryId,
				brandId,
			});
		});
	});

	describe("DELETE /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer delete requests", async () => {
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing product", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.products({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(404);
		});

		it("should delete a product", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryId = await createTestCategory(connection);
			const brandId = await createTestBrand(connection);

			const response = await api.products.post(
				{
					barcode: "123456789",
					name: "Test Product",
					description: "Test Description",
					price: 9.99,
					categoryId,
					brandId,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const productId = response.data!.id;
			const deleteResponse = await api
				.products({ id: productId })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(deleteResponse.status).toBe(204);

			// Verify the product is actually deleted
			const getResponse = await api
				.products({ id: productId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(getResponse.status).toBe(404);
		});
	});
});
