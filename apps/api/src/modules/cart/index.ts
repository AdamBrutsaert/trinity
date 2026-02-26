import Elysia, { status } from "elysia";
import z from "zod";

import { assertNever } from "../../errors";
import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./models";
import * as service from "./service";

function addItemToCartRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.post(
			"/items",
			async ({ body, userId, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.addItemToCart(tx, userId, body);
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
							case "product_not_found":
								return status(
									404,
									"Product not found" satisfies models.productNotFound,
								);
							case "failed_to_add_item_to_cart":
								return status(
									500,
									"Failed to add item to cart" satisfies models.failedToAddItemToCart,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				body: models.addItemToCartBody,
				response: {
					201: models.cartItemResponse,
					404: models.productNotFound,
					500: models.failedToAddItemToCart,
				},
			},
		);
}

function updateCartItemRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.put(
			"/items/:productId",
			async ({ params, body, userId, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.updateCartItem(
						tx,
						userId,
						params.productId,
						body.quantity,
					);
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
							case "cart_item_not_found":
								return status(
									404,
									"Cart item not found" satisfies models.cartItemNotFound,
								);
							case "failed_to_update_cart_item":
								return status(
									500,
									"Failed to update cart item" satisfies models.failedToUpdateCartItem,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					productId: z.uuidv4(),
				}),
				body: models.updateCartItemBody,
				response: {
					200: models.cartItemResponse,
					404: models.cartItemNotFound,
					500: models.failedToUpdateCartItem,
				},
			},
		);
}

function removeCartItemRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.delete(
			"/items/:productId",
			async ({ params, userId, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.removeCartItem(tx, userId, params.productId);
				});

				return result.match(
					() => status(204),
					(err) => {
						switch (err.type) {
							case "cart_item_not_found":
								return status(
									404,
									"Cart item not found" satisfies models.cartItemNotFound,
								);
							case "failed_to_remove_cart_item":
								return status(
									500,
									"Failed to remove cart item" satisfies models.failedToRemoveCartItem,
								);
							default:
								assertNever(err);
						}
					},
				);
			},
			{
				params: z.object({
					productId: z.uuidv4(),
				}),
				response: {
					204: z.void(),
					404: models.cartItemNotFound,
					500: models.failedToRemoveCartItem,
				},
			},
		);
}

function getCartItemsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.get(
			"/",
			async ({ userId, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getCartItems(tx, userId);
				});

				return result.match(
					(res) =>
						status(
							200,
							res.map((item) => ({
								...item,
								createdAt: item.createdAt.toISOString(),
								updatedAt: item.updatedAt.toISOString(),
							})),
						),
					(_err) =>
						status(
							500,
							"Failed to fetch cart" satisfies models.failedToFetchCart,
						),
				);
			},
			{
				response: {
					200: models.cartItemListResponse,
					500: models.failedToFetchCart,
				},
			},
		);
}

function clearCartRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.delete(
			"/",
			async ({ userId, database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.clearCart(tx, userId);
				});

				return result.match(
					() => status(204),
					(_err) =>
						status(
							500,
							"Failed to clear cart" satisfies models.failedToClearCart,
						),
				);
			},
			{
				response: {
					204: z.void(),
					500: models.failedToClearCart,
				},
			},
		);
}

export function createCartModule(database: DatabasePlugin) {
	return new Elysia({ name: "cart", prefix: "/cart", tags: ["cart"] })
		.use(addItemToCartRoute(database))
		.use(updateCartItemRoute(database))
		.use(removeCartItemRoute(database))
		.use(getCartItemsRoute(database))
		.use(clearCartRoute(database));
}
