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
			({ status, userId, database }) => {
				const result = service.createCartPaypalOrder(database, userId);
				return result.match(
					(response) => status(200, { orderId: response.id }),
					(error) => {
						switch (error.type) {
							case "fetch_error":
								return status(502, "Failed to fetch access token");
							case "invalid_json":
								return status(502, "Invalid JSON response from PayPal");
							case "invalid_response":
								return status(502, "Invalid response structure from PayPal");
							case "failed_to_calculate_cart_total":
								return status(500, "Failed to calculate cart total");
							default:
								assertNever(error);
						}
					},
				);
			},
			{
				response: {
					200: models.createOrderResponse,
					500: models.failedToCalculateCartTotal,
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
