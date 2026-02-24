import { assertNever } from "@/errors";
import { auth } from "@/modules/auth/macro";
import type { DatabasePlugin } from "@/modules/database";
import Elysia, { status } from "elysia";
import * as z from "zod";
import * as models from "./model";
import * as service from "./service";

function createUserRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createUser(tx, body);
				});
				return result.match(
					(res) =>
						status(201, {
							...res,
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
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
				admin: true,
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
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(
					async (tx) => await service.getUserById(tx, params.id),
				);
				return result.match(
					(res) =>
						status(200, {
							...res,
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
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
				admin: true,
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					200: models.userResponse,
					404: models.userNotFound,
					500: models.failedToFetchUser,
				},
			},
		);
}

function getUsersRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.getUsers(tx),
				);
				return result.match(
					(res) =>
						status(
							200,
							res.map((user) => ({
								...user,
								createdAt: user.createdAt.toISOString(),
								updatedAt: user.updatedAt.toISOString(),
							})),
						),
					(_err) =>
						status(
							500,
							"Failed to fetch users" satisfies models.failedToFetchUsers,
						),
				);
			},
			{
				admin: true,
				response: {
					200: models.userListResponse,
					500: models.failedToFetchUsers,
				},
			},
		);
}

function updateUserRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateUser(tx, params.id, body);
				});
				return result.match(
					(res) =>
						status(200, {
							...res,
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
					(err) => {
						switch (err.type) {
							case "user_not_found":
								return status(
									404,
									"User not found" satisfies models.userNotFound,
								);
							case "email_already_exists":
								return status(
									409,
									"Email already exists" satisfies models.emailAlreadyExists,
								);
							case "failed_to_update_user":
								return status(
									500,
									"Failed to update user" satisfies models.failedToUpdateUser,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				admin: true,
				params: z.object({
					id: z.uuidv4(),
				}),
				body: models.updateUserBody,
				response: {
					200: models.userResponse,
					404: models.userNotFound,
					409: models.emailAlreadyExists,
					500: models.failedToUpdateUser,
				},
			},
		);
}

function deleteUserRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteUser(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "user_not_found":
								return status(
									404,
									"User not found" satisfies models.userNotFound,
								);
							case "failed_to_delete_user":
								return status(
									500,
									"Failed to delete user" satisfies models.failedToDeleteUser,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				admin: true,
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					204: z.void(),
					404: models.userNotFound,
					500: models.failedToDeleteUser,
				},
			},
		);
}

export function createUsersModule(database: DatabasePlugin) {
	return new Elysia({ name: "users", prefix: "/users" })
		.use(createUserRoute(database))
		.use(getUserByIdRoute(database))
		.use(getUsersRoute(database))
		.use(updateUserRoute(database))
		.use(deleteUserRoute(database));
}
