import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { env } from "./env";
import { createAuthModule } from "./modules/auth";
import {
	createDatabaseConnection,
	createDatabasePlugin,
} from "./modules/database";
import { createUserModule } from "./modules/user";

const databasePlugin = createDatabasePlugin(
	createDatabaseConnection(env.DATABASE_URL),
);

const app = new Elysia()
	.use(
		cors({
			origin: true,
			credentials: true,
		}),
	)
	.use(
		openapi({
			documentation: {
				info: {
					title: "Trinity API",
					version: "1.0.0",
					description: "API documentation for the Trinity application",
				},
			},
		}),
	)
	.use(createAuthModule(databasePlugin))
	.use(createUserModule(databasePlugin))
	.listen({
		port: 3000,
		hostname: "0.0.0.0",
	});

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
