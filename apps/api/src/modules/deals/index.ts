import Elysia, { status } from "elysia";

import type { DatabasePlugin } from "../database";
import * as models from "./model";
import * as service from "./service";

function getDealsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.get(
			"",
			async ({ database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getDeals(tx);
				});

				return result.match(
					(res) => status(200, res),
					(_err) =>
						status(
							500,
							"Failed to fetch deals" satisfies models.failedToFetchDeals,
						),
				);
			},
			{
				response: {
					200: models.dealsResponse,
					500: models.failedToFetchDeals,
				},
			},
		)
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(async (tx) => {
					return await service.getDeals(tx);
				});

				return result.match(
					(res) => status(200, res),
					(_err) =>
						status(
							500,
							"Failed to fetch deals" satisfies models.failedToFetchDeals,
						),
				);
			},
			{
				response: {
					200: models.dealsResponse,
					500: models.failedToFetchDeals,
				},
			},
		);
}

export function createDealsModule(database: DatabasePlugin) {
	return new Elysia({ name: "deals", prefix: "/deals", tags: ["deals"] }).use(
		getDealsRoute(database),
	);
}
