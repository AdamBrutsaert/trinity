import Elysia, { status } from "elysia";
import z from "zod";

import { assertNever } from "../../errors";
import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./models";
import * as service from "./service";

function createStockRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.post(
			"/",
			async ({ body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.createStock(tx, body);
				});
				return result.match(
					(res) =>
						status(201, {
							...res,
							price: Number.parseFloat(res.price),
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
							case "failed_to_create_stock":
								return status(
									500,
									"Failed to create stock" satisfies models.failedToCreateStock,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				body: models.createStockBody,
				response: {
					201: models.stockResponse,
					404: models.productNotFound,
					500: models.failedToCreateStock,
				},
			},
		);
}

function getStockByIdRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.get(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getStockById(tx, params.id);
				});
				return result.match(
					(res) =>
						status(200, {
							...res,
							price: Number.parseFloat(res.price),
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
					(err) => {
						switch (err.type) {
							case "stock_not_found":
								return status(
									404,
									"Stock not found" satisfies models.stockNotFound,
								);
							case "failed_to_fetch_stock":
								return status(
									500,
									"Failed to fetch stock" satisfies models.failedToFetchStock,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					200: models.stockResponse,
					404: models.stockNotFound,
					500: models.failedToFetchStock,
				},
			},
		);
}

function getStocksRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.getStocks(tx),
				);
				return result.match(
					(res) =>
						status(
							200,
							res.map((stock) => ({
								...stock,
								price: Number.parseFloat(stock.price),
								createdAt: stock.createdAt.toISOString(),
								updatedAt: stock.updatedAt.toISOString(),
							})),
						),
					(_err) =>
						status(
							500,
							"Failed to fetch stocks" satisfies models.failedToFetchStocks,
						),
				);
			},
			{
				response: {
					200: models.stockListResponse,
					500: models.failedToFetchStocks,
				},
			},
		);
}

function updateStockRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.put(
			"/:id",
			async ({ params, body, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateStock(tx, params.id, body);
				});
				return result.match(
					(res) =>
						status(200, {
							...res,
							price: Number.parseFloat(res.price),
							createdAt: res.createdAt.toISOString(),
							updatedAt: res.updatedAt.toISOString(),
						}),
					(err) => {
						switch (err.type) {
							case "stock_not_found":
								return status(
									404,
									"Stock not found" satisfies models.stockNotFound,
								);
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_update_stock":
								return status(
									500,
									"Failed to update stock" satisfies models.failedToUpdateStock,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				body: models.updateStockBody,
				response: {
					200: models.stockResponse,
					404: z.union([models.stockNotFound, models.productNotFound]),
					500: models.failedToUpdateStock,
				},
			},
		);
}

function deleteStockRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.delete(
			"/:id",
			async ({ params, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.deleteStock(tx, params.id);
				});
				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "stock_not_found":
								return status(
									404,
									"Stock not found" satisfies models.stockNotFound,
								);
							case "failed_to_delete_stock":
								return status(
									500,
									"Failed to delete stock" satisfies models.failedToDeleteStock,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					id: z.uuidv4(),
				}),
				response: {
					204: z.void(),
					404: models.stockNotFound,
					500: models.failedToDeleteStock,
				},
			},
		);
}

export function createStocksModule(database: DatabasePlugin) {
	return new Elysia({ name: "stocks", prefix: "/stocks", tags: ["stocks"] })
		.use(createStockRoute(database))
		.use(getStockByIdRoute(database))
		.use(getStocksRoute(database))
		.use(updateStockRoute(database))
		.use(deleteStockRoute(database));
}
