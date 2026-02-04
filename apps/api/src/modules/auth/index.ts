import Elysia from "elysia";
import { AuthModel } from "./model";
import { Auth } from "./service";

export const auth = new Elysia({ prefix: "/auth" }).post(
	"/login",
	async ({ body }) => {
		return await Auth.login(body);
	},
	{
		body: AuthModel.loginBody,
		response: {
			200: AuthModel.loginResponse,
			401: AuthModel.loginInvalid,
		},
	},
);
