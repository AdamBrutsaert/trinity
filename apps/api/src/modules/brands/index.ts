import Elysia, { status } from "elysia";
import z from "zod";

import { assertNever } from "@/errors";
import { auth } from "@/modules/auth/macro";
import type { DatabasePlugin } from "@/modules/database";

import * as models from "./models";
import * as service from "./service";

function createBrandRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createBrand(tx, body.name);
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
							case "brand_name_already_exists":
								return status(
									409,
									"Brand already exists" satisfies models.brandAlreadyExists,
								);
							case "failed_to_create_brand":
								return status(
									500,
									"Failed to create brand" satisfies models.failedToCreateBrand,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				admin: true,
				body: models.createBrandBody,
				response: {
					201: models.brandResponse,
					409: models.brandAlreadyExists,
					500: models.failedToCreateBrand,
				},
			},
		);
}

function getBrandByIdRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getBrandById(tx, params.id);
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
							case "brand_not_found":
								return status(
									404,
									"Brand not found" satisfies models.brandNotFound,
								);
							case "failed_to_fetch_brand":
								return status(
									500,
									"Failed to fetch brand" satisfies models.failedToFetchBrand,
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
					200: models.brandResponse,
					404: models.brandNotFound,
					500: models.failedToFetchBrand,
				},
			},
		);
}

function getBrandsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.getBrands(tx),
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
							"Failed to fetch brands" satisfies models.failedToFetchBrands,
						),
				);
			},
			{
				customer: true,
				response: {
					200: models.brandListResponse,
					500: models.failedToFetchBrands,
				},
			},
		);
}

function updateBrandRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateBrand(tx, params.id, body.name);
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
							case "brand_not_found":
								return status(
									404,
									"Brand not found" satisfies models.brandNotFound,
								);
							case "brand_name_already_exists":
								return status(
									409,
									"Brand already exists" satisfies models.brandAlreadyExists,
								);
							case "failed_to_update_brand":
								return status(
									500,
									"Failed to update brand" satisfies models.failedToUpdateBrand,
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
				body: models.updateBrandBody,
				response: {
					200: models.brandResponse,
					404: models.brandNotFound,
					409: models.brandAlreadyExists,
					500: models.failedToUpdateBrand,
				},
			},
		);
}

function deleteBrandRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteBrand(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "brand_not_found":
								return status(
									404,
									"Brand not found" satisfies models.brandNotFound,
								);
							case "failed_to_delete_brand":
								return status(
									500,
									"Failed to delete brand" satisfies models.failedToDeleteBrand,
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
					404: models.brandNotFound,
					500: models.failedToDeleteBrand,
				},
			},
		);
}

export function createBrandsModule(database: DatabasePlugin) {
	return new Elysia({ name: "brands", prefix: "/brands", tags: ["brands"] })
		.use(createBrandRoute(database))
		.use(getBrandByIdRoute(database))
		.use(getBrandsRoute(database))
		.use(updateBrandRoute(database))
		.use(deleteBrandRoute(database));
}
