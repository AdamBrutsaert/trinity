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
import { createCategoriesModule } from ".";
import { login } from "../auth/service";
import {
	createDatabaseConnection,
	createDatabasePlugin,
	type Database,
} from "../database";

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

describe("Categories module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createCategoriesModule>>>;

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
		api = treaty(createCategoriesModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer creation requests", async () => {
			const response = await api.categories.post({
				name: "Test Category",
			});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should create a category", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data).toHaveProperty("name", "Test Category");
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
		});

		it("should not create a category with an existing name", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			const duplicateResponse = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(duplicateResponse.status).toBe(409);
		});
	});

	describe("GET /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer find requests", async () => {
			const response = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should find an existing category", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const categoryId = response.data!.id;
			const categoryResponse = await api
				.categories({ id: categoryId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(categoryResponse.status).toBe(200);
			expect(categoryResponse.data).toEqual(response.data);
		});

		it("should return 404 for non-existing category", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryResponse = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(categoryResponse.status).toBe(404);
		});

		it("should return 422 for invalid category ID", async () => {
			const adminToken = await createAdminUser(connection);
			const categoryResponse = await api
				.categories({ id: "invalid-uuid" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(categoryResponse.status).toBe(422);
		});
	});

	describe("GET /", () => {
		it("should return 401 or 403 for unauthenticated requests", async () => {
			const response = await api.categories.get();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api.categories.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(customerResponse.status).toBe(403);
		});

		it("should return a list of categories", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.categories.post(
				{
					name: "Test Category 1",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.categories.post(
				{
					name: "Test Category 2",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.categories.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			expect(response.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: "Test Category 1",
					}),
					expect.objectContaining({
						name: "Test Category 2",
					}),
				]),
			);
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer update requests", async () => {
			const response = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					name: "Updated Category",
				});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						name: "Updated Category",
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing category", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						name: "Updated Category",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(404);
		});

		it("should return 409 for name already in use by another category", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.categories.post(
				{
					name: "Another Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.categories({ id: response2.data!.id })
				.put(
					{
						name: "Test Category",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(409);
		});

		it("should update an existing categories", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.categories({ id: response1.data!.id })
				.put(
					{
						name: "Updated Test Category",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(200);
		});
	});

	describe("DELETE /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer delete requests", async () => {
			const response = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing category", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.categories({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(404);
		});

		it("should delete an existing category", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.categories.post(
				{
					name: "Test Category",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.categories({ id: response1.data!.id })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(204);
		});
	});
});
