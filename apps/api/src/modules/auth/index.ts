import { assertNever } from "@/errors";
import Elysia, { status } from "elysia";
import type { DatabasePlugin } from "../database";
import * as models from "./model";
import * as service from "./service";

function registerRoute(database: DatabasePlugin) {
	return new Elysia().use(database).post(
		"/register",
		async ({ body, database }) => {
			const result = await database.transaction(
				async (tx) => await service.register(tx, body),
			);
			return result.match(
				(res) => status(201, res),
				(err) => {
					switch (err.type) {
						case "email_already_exists":
							return status(
								409,
								"Email already exists" satisfies models.registerEmailExists,
							);
						case "failed_to_create_user":
							return status(
								500,
								"Failed to create user" satisfies models.registerFailed,
							);
						default:
							assertNever(err);
					}
				},
			);
		},
		{
			body: models.registerBody,
			response: {
				201: models.registerResponse,
				409: models.registerEmailExists,
				500: models.registerFailed,
			},
		},
	);
}

function loginRoute(database: DatabasePlugin) {
	return new Elysia().use(database).post(
		"/login",
		async ({ body, database }) => {
			const result = await database.transaction(
				async (tx) => await service.login(tx, body),
			);
			return result.match(
				(res) => status(200, res),
				(err) => {
					switch (err.type) {
						case "invalid_email_or_password":
							return status(
								401,
								"Invalid email or password" satisfies models.loginInvalid,
							);
						case "failed_to_fetch_user":
							return status(
								500,
								"Failed to fetch user" satisfies models.loginFailed,
							);
						default:
							assertNever(err);
					}
				},
			);
		},
		{
			body: models.loginBody,
			response: {
				200: models.loginResponse,
				401: models.loginInvalid,
				500: models.loginFailed,
			},
		},
	);
}

export function createAuthModule(database: DatabasePlugin) {
	return new Elysia({ prefix: "/auth" })
		.use(registerRoute(database))
		.use(loginRoute(database));
}
