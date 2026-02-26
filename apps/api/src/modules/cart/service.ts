import { and, eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import { cartItemsTable } from "../database/schema";
import type * as models from "./models";

export type AddItemToCartError =
	| {
			type: "product_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_add_item_to_cart";
	  };

export function addItemToCart(
	tx: Database,
	userId: string,
	body: models.addItemToCartBody,
) {
	return ResultAsync.fromPromise(
		tx
			.insert(cartItemsTable)
			.values({
				userId,
				productId: body.productId,
				quantity: body.quantity,
			})
			.returning({
				id: cartItemsTable.id,
				userId: cartItemsTable.userId,
				productId: cartItemsTable.productId,
				quantity: cartItemsTable.quantity,
				createdAt: cartItemsTable.createdAt,
				updatedAt: cartItemsTable.updatedAt,
			})
			.onConflictDoUpdate({
				target: [cartItemsTable.userId, cartItemsTable.productId],
				set: {
					quantity: body.quantity,
					updatedAt: new Date(),
				},
			}),
		(err) =>
			errorMapper<AddItemToCartError>(err, {
				onForeignKeyViolation: (constraint) => {
					switch (constraint) {
						case "cart_items_product_id_products_id_fk":
							return {
								type: "product_not_found",
								productId: body.productId,
							};
						default:
							return {
								type: "failed_to_add_item_to_cart",
							};
					}
				},
				default: () => ({
					type: "failed_to_add_item_to_cart",
				}),
			}),
	).andThen((res) => {
		const cartItem = res[0];
		if (!cartItem) {
			return errAsync({
				type: "failed_to_add_item_to_cart",
			} satisfies AddItemToCartError as AddItemToCartError);
		}
		return okAsync(cartItem);
	});
}

export type UpdateCartItemError =
	| {
			type: "cart_item_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_update_cart_item";
	  };

export function updateCartItem(
	tx: Database,
	userId: string,
	productId: string,
	quantity: number,
) {
	return ResultAsync.fromPromise(
		tx
			.update(cartItemsTable)
			.set({
				quantity,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(cartItemsTable.userId, userId),
					eq(cartItemsTable.productId, productId),
				),
			)
			.returning({
				id: cartItemsTable.id,
				userId: cartItemsTable.userId,
				productId: cartItemsTable.productId,
				quantity: cartItemsTable.quantity,
				createdAt: cartItemsTable.createdAt,
				updatedAt: cartItemsTable.updatedAt,
			}),
		(err) =>
			errorMapper<UpdateCartItemError>(err, {
				default: () => ({
					type: "failed_to_update_cart_item",
				}),
			}),
	).andThen((res) => {
		const cartItem = res[0];
		if (!cartItem) {
			return errAsync({
				type: "cart_item_not_found",
				productId,
			} satisfies UpdateCartItemError as UpdateCartItemError);
		}
		return okAsync(cartItem);
	});
}

export type RemoveCartItemError =
	| {
			type: "cart_item_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_remove_cart_item";
	  };

export function removeCartItem(
	tx: Database,
	userId: string,
	productId: string,
) {
	return ResultAsync.fromPromise(
		tx
			.delete(cartItemsTable)
			.where(
				and(
					eq(cartItemsTable.userId, userId),
					eq(cartItemsTable.productId, productId),
				),
			)
			.returning({
				id: cartItemsTable.id,
			}),
		(err) =>
			errorMapper<RemoveCartItemError>(err, {
				default: () => ({
					type: "failed_to_remove_cart_item",
				}),
			}),
	).andThen((res) => {
		const cartItem = res[0];
		if (!cartItem) {
			return errAsync({
				type: "cart_item_not_found",
				productId,
			} satisfies RemoveCartItemError as RemoveCartItemError);
		}
		return okAsync(undefined);
	});
}

export type GetCartItemsError = {
	type: "failed_to_fetch_cart";
};

export function getCartItems(tx: Database, userId: string) {
	return ResultAsync.fromPromise(
		tx.query.cartItemsTable.findMany({
			where: (table, { eq }) => eq(table.userId, userId),
			columns: {
				id: true,
				userId: true,
				productId: true,
				quantity: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetCartItemsError>(err, {
				default: () => ({
					type: "failed_to_fetch_cart",
				}),
			}),
	);
}

export type ClearCartError = {
	type: "failed_to_clear_cart";
};

export function clearCart(tx: Database, userId: string) {
	return ResultAsync.fromPromise(
		tx.delete(cartItemsTable).where(eq(cartItemsTable.userId, userId)),
		(err) =>
			errorMapper<ClearCartError>(err, {
				default: () => ({
					type: "failed_to_clear_cart",
				}),
			}),
	).map(() => undefined);
}
