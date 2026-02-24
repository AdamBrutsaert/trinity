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
import { createBrandsModule } from ".";
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

describe("Brands module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createBrandsModule>>>;

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
		api = treaty(createBrandsModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer creation requests", async () => {
			const response = await api.brands.post({
				name: "Test Brand",
			});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should create a brand", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data).toHaveProperty("name", "Test Brand");
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
		});

		it("should not create a brand with an existing name", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			const duplicateResponse = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(duplicateResponse.status).toBe(409);
		});
	});

	describe("GET /:id", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to find a brand", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);

			const response = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const brandId = response.data!.id;
			const brandResponse = await api
				.brands({ id: brandId })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(brandResponse.status).toBe(200);
			expect(brandResponse.data).toEqual(response.data);
		});

		it("should find an existing brand", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const brandId = response.data!.id;
			const brandResponse = await api
				.brands({ id: brandId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(brandResponse.status).toBe(200);
			expect(brandResponse.data).toEqual(response.data);
		});

		it("should return 404 for non-existing brand", async () => {
			const adminToken = await createAdminUser(connection);
			const brandResponse = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(brandResponse.status).toBe(404);
		});

		it("should return 422 for invalid brand ID", async () => {
			const adminToken = await createAdminUser(connection);
			const brandResponse = await api
				.brands({ id: "invalid-uuid" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(brandResponse.status).toBe(422);
		});
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.brands.get();
			expect(response.status).toBe(401);
		});

		it("should allow customers to list brands", async () => {
			const adminToken = await createAdminUser(connection);
			const customerToken = await createCustomerUser(connection);

			const response1 = await api.brands.post(
				{
					name: "Test Brand 1",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.brands.post(
				{
					name: "Test Brand 2",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.brands.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
		});

		it("should return a list of brands", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.brands.post(
				{
					name: "Test Brand 1",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.brands.post(
				{
					name: "Test Brand 2",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.brands.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(2);
			expect(response.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						name: "Test Brand 1",
					}),
					expect.objectContaining({
						name: "Test Brand 2",
					}),
				]),
			);
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer update requests", async () => {
			const response = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					name: "Updated Brand",
				});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						name: "Updated Brand",
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing brand", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						name: "Updated Brand",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(404);
		});

		it("should return 409 for name already in use by another brand", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.brands.post(
				{
					name: "Another Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.brands({ id: response2.data!.id })
				.put(
					{
						name: "Test Brand",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(409);
		});

		it("should update an existing brands", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.brands({ id: response1.data!.id })
				.put(
					{
						name: "Updated Test Brand",
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(200);
		});
	});

	describe("DELETE /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer delete requests", async () => {
			const response = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerUser(connection);
			const customerResponse = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing brand", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.brands({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(404);
		});

		it("should delete an existing brand", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.brands.post(
				{
					name: "Test Brand",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.brands({ id: response1.data!.id })
				.delete({}, { headers: { Authorization: `Bearer ${adminToken}` } });
			expect(response.status).toBe(204);
		});
	});
});
