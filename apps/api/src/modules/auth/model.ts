import { t } from "elysia";

export const loginBody = t.Object({
	email: t.String({ maxLength: 255 }),
	password: t.String({ maxLength: 255 }),
});
export type loginBody = typeof loginBody.static;

export const loginResponse = t.Object({
	token: t.String(),
});
export type loginResponse = typeof loginResponse.static;

export const loginInvalid = t.Literal("Invalid email or password");
export type loginInvalid = typeof loginInvalid.static;
