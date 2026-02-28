import Elysia, { status } from "elysia";

import { authGuard } from "../auth/middleware";
import type { DatabasePlugin } from "../database";
import * as models from "./model";
import * as service from "./service";

function getReportsRoute(database: DatabasePlugin) {
	return new Elysia()
		.use(database)
		.use(authGuard("admin"))
		.get(
			"/",
			async ({ database }) => {
				const result = await database.transaction(
					async (tx) => await service.generateReports(tx),
				);
				return result.match(
					(res) => status(200, res),
					(_err) =>
						status(
							500,
							"Failed to generate reports" satisfies models.failedToGenerateReports,
						),
				);
			},
			{
				response: {
					200: models.reportsResponseSchema,
					401: models.userUnauthorized,
					403: models.userForbidden,
					500: models.failedToGenerateReports,
				},
			},
		);
}

export function createReportsModule(database: DatabasePlugin) {
	return new Elysia({ prefix: "/reports" }).use(getReportsRoute(database));
}
