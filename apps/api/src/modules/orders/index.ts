import Elysia from "elysia";
import z from "zod";

import { assertNever } from "../../errors";
import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./models";
import * as service from "./service";

export function createOrderRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.post(
			"/",
			async ({ status, userId, database }) => {
				const result = await database.transaction(async (tx) =>
					service.createCartPaypalOrder(tx, userId),
				);
				return result.match(
					(response) => status(200, { orderId: response.orderId }),
					(error) => {
						switch (error.type) {
							case "fetch_error":
								return status(
									502,
									"Failed to fetch access token" satisfies models.failedToFetchAccessTokenResponse,
								);
							case "invalid_json":
								return status(
									502,
									"Invalid JSON response from PayPal" satisfies models.invalidJsonResponse,
								);
							case "invalid_response":
								return status(
									502,
									"Invalid response structure from PayPal" satisfies models.invalidResponseStructure,
								);
							case "failed_to_calculate_cart_total":
								return status(
									500,
									"Failed to calculate cart total" satisfies models.failedToCalculateCartTotal,
								);
							case "empty_cart":
								return status(400, "Cart is empty" satisfies models.emptyCart);
							case "failed_to_fetch_cart_items":
								return status(
									500,
									"Failed to fetch cart items" satisfies models.failedToFetchCartItems,
								);
							case "failed_to_create_invoice":
								return status(
									500,
									"Failed to create invoice" satisfies models.failedToCreateInvoice,
								);
							case "failed_to_create_invoice_items":
								return status(
									500,
									"Failed to create invoice items" satisfies models.failedToCreateInvoiceItems,
								);
							case "failed_to_clear_cart":
								return status(
									500,
									"Failed to clear cart" satisfies models.failedToClearCart,
								);
							default:
								assertNever(error);
						}
					},
				);
			},
			{
				response: {
					200: models.createOrderResponse,
					400: models.emptyCart,
					500: z.union([
						models.failedToCalculateCartTotal,
						models.failedToFetchCartItems,
						models.failedToCreateInvoice,
						models.failedToCreateInvoiceItems,
						models.failedToClearCart,
					]),
					502: z.union([
						models.failedToFetchAccessTokenResponse,
						models.invalidJsonResponse,
						models.invalidResponseStructure,
					]),
				},
			},
		);
}

export function createOrdersModule(database: DatabasePlugin) {
	return new Elysia({
		name: "orders",
		prefix: "/orders",
		tags: ["orders"],
	}).use(createOrderRoute(database));
}
