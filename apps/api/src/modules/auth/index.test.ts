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
import { createAuthModule } from ".";
import { createDatabaseConnection, createDatabasePlugin } from "../database";

describe("Auth module", () => {
	let container: StartedPostgreSqlContainer;
	let api: ReturnType<typeof treaty<ReturnType<typeof createAuthModule>>>;

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
		api = treaty(createAuthModule(createDatabasePlugin(connection)));
	});

	afterEach(async () => {
		const admin = new SQL({ url: container.getConnectionUri() });
		await admin`DROP DATABASE db_test WITH (FORCE)`;
		await admin.close();
	});

	it("should register a new user", async () => {
		const response = await api.auth.register.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});

		expect(response.status).toBe(201);
		expect(response.data).toHaveProperty("token");
	});

	it("should not register an user with an existing email", async () => {
		const response = await api.auth.register.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(response.status).toBe(201);

		const duplicateResponse = await api.auth.register.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(duplicateResponse.status).toBe(409);
	});

	it("should login an existing user", async () => {
		const registerResponse = await api.auth.register.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(registerResponse.status).toBe(201);

		const loginResponse = await api.auth.login.post({
			email: "john.doe@example.com",
			password: "password123",
		});
		expect(loginResponse.status).toBe(200);
		expect(loginResponse.data).toHaveProperty("token");
	});

	it("should not login with invalid credentials", async () => {
		const loginResponse = await api.auth.login.post({
			email: "doesnotexist@example.com",
			password: "doesnotexist",
		});
		expect(loginResponse.status).toBe(401);
	});

	it("should not login with invalid password", async () => {
		const registerResponse = await api.auth.register.post({
			email: "john.doe@example.com",
			password: "password123",
			firstName: "John",
			lastName: "Doe",
		});
		expect(registerResponse.status).toBe(201);

		const loginResponse = await api.auth.login.post({
			email: "john.doe@example.com",
			password: "wrongpassword",
		});
		expect(loginResponse.status).toBe(401);
	});
});
