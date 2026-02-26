import Elysia from "elysia";
import z from "zod";

import type { DatabasePlugin } from "../database";

function helloWorldRoute() {
	return new Elysia().get("/", "Welcome to Trinity API", {
		response: {
			200: z.literal("Welcome to Trinity API"),
		},
	});
}

function healthCheckRoute(database: DatabasePlugin) {
	return new Elysia().use(database).get(
		"/health",
		async ({ database }) => {
			const isDatabaseConnected = await database.transaction(async (tx) => {
				try {
					await tx.execute("SELECT 1");
					return true;
				} catch {
					return false;
				}
			});

			return {
				status: "ok",
				database: isDatabaseConnected ? "connected" : "disconnected",
			};
		},
		{
			response: {
				200: z.object({
					status: z.literal("ok"),
					database: z.union([
						z.literal("connected"),
						z.literal("disconnected"),
					]),
				}),
			},
		},
	);
}

export function createHealthModule(database: DatabasePlugin) {
	return new Elysia({ name: "health", tags: ["health"] })
		.use(helloWorldRoute())
		.use(healthCheckRoute(database));
}
