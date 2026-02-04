import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { auth } from "./modules/auth";

const app = new Elysia()
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
	.use(auth)
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
