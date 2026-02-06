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
import { createDatabaseConnection, createDatabasePlugin } from "../database";

describe("User module", () => {
	let container: StartedPostgreSqlContainer;
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

		const connection = createDatabaseConnection(
			`postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${container.getPort()}/db_test`,
		);
		api = treaty(createUserModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	it("should create an user", async () => {
		const response = await api.users.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});

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
	});

	it("should not create an user with an existing email", async () => {
		const response = await api.users.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(response.status).toBe(201);

		const duplicateResponse = await api.users.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(duplicateResponse.status).toBe(409);
	});

	it("should find an existing user", async () => {
		const response = await api.users.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(response.status).toBe(201);

		// biome-ignore lint/style/noNonNullAssertion: status is checked above
		const userId = response.data!.id;
		const userResponse = await api.users({ id: userId }).get();
		expect(userResponse.status).toBe(200);
		expect(userResponse.data).toEqual(response.data);
	});

	it("should return 404 for non-existing user", async () => {
		const userResponse = await api
			.users({ id: "e66dbdb0-97af-4edf-ad90-fbb749a52ee5" })
			.get();
		expect(userResponse.status).toBe(404);
	});

	it("should return 422 for invalid user ID", async () => {
		const userResponse = await api.users({ id: "invalid-uuid" }).get();
		console.log(userResponse);
		expect(userResponse.status).toBe(422);
	});
});
