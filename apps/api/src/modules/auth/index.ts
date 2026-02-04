import { db } from "@/db";
import Elysia, { status } from "elysia";
import * as models from "./model";
import * as service from "./service";

export const auth = new Elysia({ prefix: "/auth" })
	.post(
		"/register",
		async ({ body }) => status(201, await service.register(db, body)),
		{
			body: models.registerBody,
			response: {
				201: models.registerResponse,
				409: models.registerEmailExists,
				500: models.registerFailed,
			},
		},
	)
	.post("/login", async ({ body }) => service.login(db, body), {
		body: models.loginBody,
		response: {
			200: models.loginResponse,
			401: models.loginInvalid,
		},
	});
