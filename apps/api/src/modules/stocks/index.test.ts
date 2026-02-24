import { login } from "@/modules/auth/service";
import { createBrand } from "@/modules/brands/service";
import { createCategory } from "@/modules/categories/service";
import {
	createDatabaseConnection,
	createDatabasePlugin,
	type Database,
} from "@/modules/database";
import { createProduct } from "@/modules/products/service";
import { createUser } from "@/modules/users/service";
import { treaty } from "@elysiajs/eden";
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
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
import { drizzle } from "drizzle-orm/bun-sql";
import { migrate } from "drizzle-orm/bun-sql/migrator";
import { Wait } from "testcontainers";
import { createStocksModule } from ".";

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

async function createTestProduct(tx: Database) {
	const brand = await createBrand(tx, "Test Brand");
	const category = await createCategory(tx, "Test Category");

	const brandId = brand._unsafeUnwrap().id;
	const categoryId = category._unsafeUnwrap().id;

	const product = await createProduct(tx, {
		barcode: "1234567890",
		name: "Test Product",
		description: "Test Description",
		imageUrl: "https://example.com/image.jpg",
		brandId,
		categoryId,
		energyKcal: 100,
		fat: 10,
		carbs: 20,
		protein: 5,
		salt: 0.5,
	});

	return product._unsafeUnwrap().id;
}

describe("Stocks module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createStocksModule>>>;

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
		api = treaty(createStocksModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer creation requests", async () => {
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post({
				productId,
				price: 9.99,
				quantity: 100,
			});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should create a stock", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data).toHaveProperty("productId", productId);
			expect(response.data).toHaveProperty("price", 9.99);
			expect(response.data).toHaveProperty("quantity", 100);
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
		});

		it("should not create a stock with a non-existing product", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.stocks.post(
				{
					productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(404);
		});
	});

	describe("GET /:id", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to find a stock", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const stockId = response.data!.id;
			const stockResponse = await api
				.stocks({ id: stockId })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(stockResponse.status).toBe(200);
			expect(stockResponse.data).toEqual(response.data);
		});

		it("should find an existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const stockId = response.data!.id;
			const stockResponse = await api
				.stocks({ id: stockId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(stockResponse.status).toBe(200);
			expect(stockResponse.data).toEqual(response.data);
		});

		it("should return 404 for non-existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const stockResponse = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(stockResponse.status).toBe(404);
		});

		it("should return 422 for invalid stock ID", async () => {
			const adminToken = await createAdminUser(connection);
			const stockResponse = await api
				.stocks({ id: "invalid-uuid" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(stockResponse.status).toBe(422);
		});
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.stocks.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to list stocks", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);
			const productId = await createTestProduct(connection);

			const response1 = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.stocks.post(
				{
					productId,
					price: 14.99,
					quantity: 50,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.stocks.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
		});

		it("should return a list of stocks", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response1 = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.stocks.post(
				{
					productId,
					price: 14.99,
					quantity: 50,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.stocks.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			expect(response.data).toContainEqual(response1.data);
			expect(response.data).toContainEqual(response2.data);
		});

		it("should return an empty list when no stocks exist", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.stocks.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(0);
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer update requests", async () => {
			const productId = await createTestProduct(connection);

			const response = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					productId,
					price: 19.99,
					quantity: 200,
				});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						productId,
						price: 19.99,
						quantity: 200,
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should update an existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const stockId = response.data!.id;
			const updateResponse = await api.stocks({ id: stockId }).put(
				{
					productId,
					price: 19.99,
					quantity: 200,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(200);
			expect(updateResponse.data).toHaveProperty("id", stockId);
			expect(updateResponse.data).toHaveProperty("productId", productId);
			expect(updateResponse.data).toHaveProperty("price", 19.99);
			expect(updateResponse.data).toHaveProperty("quantity", 200);
		});

		it("should return 404 for non-existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const updateResponse = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						productId,
						price: 19.99,
						quantity: 200,
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(updateResponse.status).toBe(404);
		});

		it("should return 404 for non-existing product", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const stockId = response.data!.id;
			const updateResponse = await api.stocks({ id: stockId }).put(
				{
					productId: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5",
					price: 19.99,
					quantity: 200,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(404);
		});

		it("should return 422 for invalid stock ID", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const updateResponse = await api.stocks({ id: "invalid-uuid" }).put(
				{
					productId,
					price: 19.99,
					quantity: 200,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(updateResponse.status).toBe(422);
		});
	});

	describe("DELETE /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer delete requests", async () => {
			const response = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should delete an existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const productId = await createTestProduct(connection);

			const response = await api.stocks.post(
				{
					productId,
					price: 9.99,
					quantity: 100,
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const stockId = response.data!.id;
			const deleteResponse = await api
				.stocks({ id: stockId })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(deleteResponse.status).toBe(204);

			const getResponse = await api
				.stocks({ id: stockId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(getResponse.status).toBe(404);
		});

		it("should return 404 for non-existing stock", async () => {
			const adminToken = await createAdminUser(connection);
			const deleteResponse = await api
				.stocks({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(deleteResponse.status).toBe(404);
		});

		it("should return 422 for invalid stock ID", async () => {
			const adminToken = await createAdminUser(connection);
			const deleteResponse = await api
				.stocks({ id: "invalid-uuid" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(deleteResponse.status).toBe(422);
		});
	});
});
