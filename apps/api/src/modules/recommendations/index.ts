import Elysia, { status } from "elysia";

import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./model";
import * as service from "./service";

function getRecommendationsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("customer"))
		.get(
			"",
			async ({ database, userId }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getRecommendations(tx, userId);
				});

				return result.match(
					(res) => status(200, res),
					(_err) =>
						status(
							500,
							"Failed to fetch recommendations" satisfies models.failedToFetchRecommendations,
						),
				);
			},
			{
				response: {
					200: models.recommendationsResponse,
					500: models.failedToFetchRecommendations,
				},
			},
		)
		.get(
			"/",
			async ({ database, userId }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getRecommendations(tx, userId);
				});

				return result.match(
					(res) => status(200, res),
					(_err) =>
						status(
							500,
							"Failed to fetch recommendations" satisfies models.failedToFetchRecommendations,
						),
				);
			},
			{
				response: {
					200: models.recommendationsResponse,
					500: models.failedToFetchRecommendations,
				},
			},
		);
}

export function createRecommendationsModule(database: DatabasePlugin) {
	return new Elysia({
		name: "recommendations",
		prefix: "/recommendations",
		tags: ["recommendations"],
	}).use(getRecommendationsRoute(database));
}
