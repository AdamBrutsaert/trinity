import { assertNever } from "@/errors";
import type { DatabasePlugin } from "@/modules/database";
import Elysia, { status } from "elysia";
import * as models from "./model";
import * as service from "./service";

function createUserRoute(database: DatabasePlugin) {
	return new Elysia().use(database).post(
		"/",
		async ({ body, database }) => {
			const result = await database.transaction(async (tx) => {
				return await service.createUser(tx, body);
			});
			return result.match(
				(res) => status(201, res),
				(err) => {
					switch (err.type) {
						case "email_already_exists":
							return status(
								409,
								"Email already exists" satisfies models.emailAlreadyExists,
							);
						case "failed_to_create_user":
							return status(
								500,
								"Failed to create user" satisfies models.failedToCreateUser,
							);
						default:
							assertNever(err);
					}
				},
			);
		},
		{
			body: models.createUserBody,
			response: {
				201: models.userResponse,
				409: models.emailAlreadyExists,
				500: models.failedToCreateUser,
			},
		},
	);
}

function getUserByIdRoute(database: DatabasePlugin) {
	return new Elysia().use(database).get(
		"/:id",
		async ({ params, database }) => {
			const result = await database.transaction(
				async (tx) => await service.getUserById(tx, params.id),
			);
			return result.match(
				(res) => status(200, res),
				(err) => {
					switch (err.type) {
						case "user_not_found":
							return status(
								404,
								"User not found" satisfies models.userNotFound,
							);
						case "failed_to_fetch_user":
							return status(
								500,
								"Failed to fetch user" satisfies models.failedToFetchUser,
							);
						default:
							assertNever(err);
					}
				},
			);
		},
		{
			response: {
				200: models.userResponse,
				404: models.userNotFound,
				500: models.failedToFetchUser,
			},
		},
	);
}

export function createUserModule(database: DatabasePlugin) {
	return new Elysia({ prefix: "/users" })
		.use(createUserRoute(database))
		.use(getUserByIdRoute(database));
}
