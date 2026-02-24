import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import * as z from "zod";

import { env } from "@/env";
import { createAuthModule } from "@/modules/auth";
import { createBrandsModule } from "@/modules/brands";
import { createCategoriesModule } from "@/modules/categories";
import {
	createDatabaseConnection,
	createDatabasePlugin,
} from "@/modules/database";
import { createProductsModule } from "@/modules/products";
import { createStocksModule } from "@/modules/stocks";
import { createUsersModule } from "@/modules/users";

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
			mapJsonSchema: {
				zod: z.toJSONSchema,
			},
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
	.use(createUsersModule(databasePlugin))
	.use(createBrandsModule(databasePlugin))
	.use(createCategoriesModule(databasePlugin))
	.use(createProductsModule(databasePlugin))
	.use(createStocksModule(databasePlugin))
	.listen({
		port: 3000,
		hostname: "0.0.0.0",
	});

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
