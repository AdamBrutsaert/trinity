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
import { createUserModule } from ".";
import { login } from "../auth/service";
import {
	createDatabaseConnection,
	createDatabasePlugin,
	type Database,
} from "../database";
import { createUser } from "./service";

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

async function createCustomerToken(tx: Database) {
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

describe("User module", () => {
	let container: StartedPostgreSqlContainer;
	let connection: ReturnType<typeof createDatabaseConnection>;
	let api: ReturnType<typeof treaty<ReturnType<typeof createUserModule>>>;

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
		api = treaty(createUserModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	describe("POST /", () => {
		it("should return 401 or 403 for unauthenticated or customer creation requests", async () => {
			const response = await api.users.post({
				email: "john.doe@example.com",
				password: "password123",
				firstName: "John",
				lastName: "Doe",
				role: "customer",
			});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerToken(connection);
			const customerResponse = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${customerToken}` } },
			);
			expect(customerResponse.status).toBe(403);
		});

		it("should create an user", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);

			expect(response.status).toBe(201);
			expect(response.data).toHaveProperty("id");
			expect(response.data?.email).toBe("john.doe@example.com");
			expect(response.data?.firstName).toBe("John");
			expect(response.data?.lastName).toBe("Doe");
			expect(response.data?.phoneNumber).toBeNull();
			expect(response.data?.address).toBeNull();
			expect(response.data?.zipCode).toBeNull();
			expect(response.data?.city).toBeNull();
			expect(response.data?.country).toBeNull();
			expect(response.data?.role).toBe("customer");
			expect(response.data).toHaveProperty("createdAt");
			expect(response.data).toHaveProperty("updatedAt");
		});

		it("should not create an user with an existing email", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			const duplicateResponse = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(duplicateResponse.status).toBe(409);
		});
	});

	describe("GET /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer find requests", async () => {
			const response = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerToken(connection);
			const customerResponse = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${customerToken}` } });
			expect(customerResponse.status).toBe(403);
		});

		it("should find an existing user", async () => {
			const adminToken = await createAdminUser(connection);

			const response = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response.status).toBe(201);

			// biome-ignore lint/style/noNonNullAssertion: status is checked above
			const userId = response.data!.id;
			const userResponse = await api
				.users({ id: userId })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(userResponse.status).toBe(200);
			expect(userResponse.data).toEqual(response.data);
		});

		it("should return 404 for non-existing user", async () => {
			const adminToken = await createAdminUser(connection);
			const userResponse = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(userResponse.status).toBe(404);
		});

		it("should return 422 for invalid user ID", async () => {
			const adminToken = await createAdminUser(connection);
			const userResponse = await api
				.users({ id: "invalid-uuid" })
				.get({ headers: { Authorization: `Bearer ${adminToken}` } });
			expect(userResponse.status).toBe(422);
		});
	});

	describe("GET /", () => {
		it("should return 401 for unauthenticated requests", async () => {
			const response = await api.users.get();
			expect(response.status).toBe(401);

			const customerToken = await createCustomerToken(connection);
			const customerResponse = await api.users.get({
				headers: { Authorization: `Bearer ${customerToken}` },
			});
			expect(customerResponse.status).toBe(403);
		});

		it("should return a list of users", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.users.post(
				{
					email: "jane.doe@example.com",
					password: "password123",
					firstName: "Jane",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api.users.get({
				headers: { Authorization: `Bearer ${adminToken}` },
			});
			expect(response.status).toBe(200);
			expect(response.data).toHaveLength(3);
			expect(response.data).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						email: "john.doe@example.com",
					}),
					expect.objectContaining({
						email: "jane.doe@example.com",
					}),
				]),
			);
		});
	});

	describe("PUT /:id", () => {
		it("should return 401 or 403 for unauthenticated or customer update requests", async () => {
			const response = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put({
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
					address: null,
					city: null,
					country: null,
					phoneNumber: null,
					zipCode: null,
				});
			expect(response.status).toBe(401);

			const customerToken = await createCustomerToken(connection);
			const customerResponse = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						email: "john.doe@example.com",
						password: "password123",
						firstName: "John",
						lastName: "Doe",
						role: "customer",
						address: null,
						city: null,
						country: null,
						phoneNumber: null,
						zipCode: null,
					},
					{ headers: { Authorization: `Bearer ${customerToken}` } },
				);
			expect(customerResponse.status).toBe(403);
		});

		it("should return 404 for non-existing user", async () => {
			const adminToken = await createAdminUser(connection);
			const response = await api
				.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
				.put(
					{
						email: "john.doe@example.com",
						password: "password123",
						firstName: "John",
						lastName: "Doe",
						role: "customer",
						address: null,
						city: null,
						country: null,
						phoneNumber: null,
						zipCode: null,
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(404);
		});

		it("should return 409 for email already in use by another user", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response2 = await api.users.post(
				{
					email: "jane.doe@example.com",
					password: "password123",
					firstName: "Jane",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response2.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.users({ id: response2.data!.id })
				.put(
					{
						email: "john.doe@example.com",
						password: "password123",
						firstName: "John",
						lastName: "Doe",
						role: "customer",
						address: null,
						city: null,
						country: null,
						phoneNumber: null,
						zipCode: null,
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(409);
		});

		it("should update an existing user", async () => {
			const adminToken = await createAdminUser(connection);

			const response1 = await api.users.post(
				{
					email: "john.doe@example.com",
					password: "password123",
					firstName: "John",
					lastName: "Doe",
					role: "customer",
				},
				{ headers: { Authorization: `Bearer ${adminToken}` } },
			);
			expect(response1.status).toBe(201);

			const response = await api
				// biome-ignore lint/style/noNonNullAssertion: asserted before
				.users({ id: response1.data!.id })
				.put(
					{
						email: "john.doe@example.com",
						password: "otherpassword123",
						firstName: "Johnny",
						lastName: "Doe",
						role: "customer",
						address: null,
						city: null,
						country: null,
						phoneNumber: null,
						zipCode: null,
					},
					{ headers: { Authorization: `Bearer ${adminToken}` } },
				);
			expect(response.status).toBe(200);
		});
	});
});
