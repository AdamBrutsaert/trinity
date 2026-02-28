import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import * as z from "zod";

import { env } from "./env";
import { createAuthModule } from "./modules/auth";
import { createBrandsModule } from "./modules/brands";
import { createCartModule } from "./modules/cart";
import { createCategoriesModule } from "./modules/categories";
import {
	createDatabaseConnection,
	createDatabasePlugin,
} from "./modules/database";
import { createHealthModule } from "./modules/health";
import { createInvoicesModule } from "./modules/invoices";
import { createOrdersModule } from "./modules/orders";
import { createProductsModule } from "./modules/products";
import { createReportsModule } from "./modules/reports";
import { createUsersModule } from "./modules/users";

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
	.use(databasePlugin)
	.use(createHealthModule(databasePlugin))
	.use(createAuthModule(databasePlugin))
	.use(createUsersModule(databasePlugin))
	.use(createBrandsModule(databasePlugin))
	.use(createCategoriesModule(databasePlugin))
	.use(createProductsModule(databasePlugin))
	.use(createCartModule(databasePlugin))
	.use(createOrdersModule(databasePlugin))
	.use(createInvoicesModule(databasePlugin))
	.use(createReportsModule(databasePlugin));

export default app;

// Start the server only if the PORT environment variable is set and valid
// This allows the app to be imported without starting the server, which is useful for testing
// and deployment in environments where the server is started separately (e.g., serverless platforms)
const portResult = z.coerce.number().safeParse(process.env.PORT);
if (portResult.success) {
	app.listen(portResult.data);
}
