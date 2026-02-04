import Elysia from "elysia";
import * as models from "./model";
import * as service from "./service";

export const auth = new Elysia({ prefix: "/auth" }).post(
	"/login",
	async ({ body }) => service.login(body),
	{
		body: models.loginBody,
		response: {
			200: models.loginResponse,
			401: models.loginInvalid,
		},
	},
);
