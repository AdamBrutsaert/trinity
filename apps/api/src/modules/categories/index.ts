import Elysia, { status } from "elysia";
import z from "zod";

import { assertNever } from "../../errors";
import { auth } from "../auth/macro";
import type { DatabasePlugin } from "../database";
import * as models from "./models";
import * as service from "./service";

function createCategoryRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createCategory(tx, body.name);
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
							case "category_name_already_exists":
								return status(
									409,
									"Category already exists" satisfies models.categoryAlreadyExists,
								);
							case "failed_to_create_category":
								return status(
									500,
									"Failed to create category" satisfies models.failedToCreateCategory,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				admin: true,
				body: models.createCategoryBody,
				response: {
					201: models.categoryResponse,
					409: models.categoryAlreadyExists,
					500: models.failedToCreateCategory,
				},
			},
		);
}

function getCategoryByIdRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getCategoryById(tx, params.id);
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
							case "category_not_found":
								return status(
									404,
									"Category not found" satisfies models.categoryNotFound,
								);
							case "failed_to_fetch_category":
								return status(
									500,
									"Failed to fetch category" satisfies models.failedToFetchCategory,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				customer: true,
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					200: models.categoryResponse,
					404: models.categoryNotFound,
					500: models.failedToFetchCategory,
				},
			},
		);
}

function getCategoriesRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.getCategories(tx),
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
							"Failed to fetch categories" satisfies models.failedToFetchCategories,
						),
				);
			},
			{
				customer: true,
				response: {
					200: models.categoryListResponse,
					500: models.failedToFetchCategories,
				},
			},
		);
}

function updateCategoryRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateCategory(tx, params.id, body.name);
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
							case "category_not_found":
								return status(
									404,
									"Category not found" satisfies models.categoryNotFound,
								);
							case "category_name_already_exists":
								return status(
									409,
									"Category already exists" satisfies models.categoryAlreadyExists,
								);
							case "failed_to_update_category":
								return status(
									500,
									"Failed to update category" satisfies models.failedToUpdateCategory,
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
				body: models.updateCategoryBody,
				response: {
					200: models.categoryResponse,
					404: models.categoryNotFound,
					409: models.categoryAlreadyExists,
					500: models.failedToUpdateCategory,
				},
			},
		);
}

function deleteCategoryRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteCategory(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "category_not_found":
								return status(
									404,
									"Category not found" satisfies models.categoryNotFound,
								);
							case "failed_to_delete_category":
								return status(
									500,
									"Failed to delete category" satisfies models.failedToDeleteCategory,
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
					404: models.categoryNotFound,
					500: models.failedToDeleteCategory,
				},
			},
		);
}

export function createCategoriesModule(database: DatabasePlugin) {
	return new Elysia({
		name: "categories",
		prefix: "/categories",
		tags: ["categories"],
	})
		.use(createCategoryRoute(database))
		.use(getCategoryByIdRoute(database))
		.use(getCategoriesRoute(database))
		.use(updateCategoryRoute(database))
		.use(deleteCategoryRoute(database));
}
