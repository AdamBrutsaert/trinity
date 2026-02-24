import Elysia, { status } from "elysia";
import z from "zod";

import { assertNever } from "@/errors";
import { auth } from "@/modules/auth/macro";
import type { DatabasePlugin } from "@/modules/database";

import * as models from "./models";
import * as service from "./service";

function createProductRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createProduct(tx, body);
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
							case "product_already_exists":
								return status(
									409,
									"Product already exists" satisfies models.productAlreadyExists,
								);
							case "brand_not_found":
								return status(
									404,
									"Brand not found" satisfies models.brandNotFound,
								);
							case "category_not_found":
								return status(
									404,
									"Category not found" satisfies models.categoryNotFound,
								);
							case "failed_to_create_product":
								return status(
									500,
									"Failed to create product" satisfies models.failedToCreateProduct,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				admin: true,
				body: models.createProductBody,
				response: {
					201: models.productResponse,
					404: models.brandNotFound.or(models.categoryNotFound),
					409: models.productAlreadyExists,
					500: models.failedToCreateProduct,
				},
			},
		);
}

function getProductByIdRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getProductById(tx, params.id);
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
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_fetch_product":
								return status(
									500,
									"Failed to fetch product" satisfies models.failedToFetchProduct,
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
					200: models.productResponse,
					404: models.productNotFound,
					500: models.failedToFetchProduct,
				},
			},
		);
}

function getProductByBarcodeRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/barcode/:barcode",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getProductByBarcode(tx, params.barcode);
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
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_fetch_product":
								return status(
									500,
									"Failed to fetch product" satisfies models.failedToFetchProduct,
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
					barcode: z.string().min(1).max(50),
				}),
				response: {
					200: models.productResponse,
					404: models.productNotFound,
					500: models.failedToFetchProduct,
				},
			},
		);
}

function getProductsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getProducts(tx);
				});
				return result.match(
					(res) =>
						status(
							200,
							res.map((product) => ({
								...product,
								createdAt: product.createdAt.toISOString(),
								updatedAt: product.updatedAt.toISOString(),
							})),
						),
					(_err) =>
						status(
							500,
							"Failed to fetch products" satisfies models.failedToFetchProducts,
						),
				);
			},
			{
				customer: true,
				response: {
					200: models.productListResponse,
					500: models.failedToFetchProducts,
				},
			},
		);
}

function updateProductRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateProduct(tx, params.id, body);
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
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "brand_not_found":
								return status(
									404,
									"Brand not found" satisfies models.brandNotFound,
								);
							case "category_not_found":
								return status(
									404,
									"Category not found" satisfies models.categoryNotFound,
								);
							case "product_already_exists":
								return status(
									409,
									"Product already exists" satisfies models.productAlreadyExists,
								);
							case "failed_to_update_product":
								return status(
									500,
									"Failed to update product" satisfies models.failedToUpdateProduct,
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
				body: models.updateProductBody,
				response: {
					200: models.productResponse,
					404: models.productNotFound
						.or(models.brandNotFound)
						.or(models.categoryNotFound),
					409: models.productAlreadyExists,
					500: models.failedToUpdateProduct,
				},
			},
		);
}

function deleteProductRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(auth)
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteProduct(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_delete_product":
								return status(
									500,
									"Failed to delete product" satisfies models.failedToDeleteProduct,
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
					404: models.productNotFound,
					500: models.failedToDeleteProduct,
				},
			},
		);
}

export function createProductsModule(database: DatabasePlugin) {
	return new Elysia({ name: "products", prefix: "/products" })
		.use(createProductRoute(database))
		.use(getProductByIdRoute(database))
		.use(getProductByBarcodeRoute(database))
		.use(getProductsRoute(database))
		.use(updateProductRoute(database))
		.use(deleteProductRoute(database));
}
