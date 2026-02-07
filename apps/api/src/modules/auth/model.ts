import { t } from "elysia";

export const registerBody = t.Object({
	email: t.String({ format: "email", maxLength: 255 }),
	password: t.String({ minLength: 8, maxLength: 255 }),
	firstName: t.String({ maxLength: 100 }),
	lastName: t.String({ maxLength: 100 }),
	phoneNumber: t.Optional(t.String({ maxLength: 30 })),
	address: t.Optional(t.String()),
	zipCode: t.Optional(t.String({ maxLength: 20 })),
	city: t.Optional(t.String({ maxLength: 100 })),
	country: t.Optional(t.String({ maxLength: 100 })),
});
export type registerBody = typeof registerBody.static;

export const registerResponse = t.Object({
	token: t.String(),
});
export type registerResponse = typeof registerResponse.static;

export const registerEmailExists = t.Literal("Email already exists");
export type registerEmailExists = typeof registerEmailExists.static;

export const registerFailed = t.Literal("Failed to create user");
export type registerFailed = typeof registerFailed.static;

export const loginBody = t.Object({
	email: t.String({ format: "email", maxLength: 255 }),
	password: t.String({ minLength: 8, maxLength: 255 }),
});
export type loginBody = typeof loginBody.static;

export const loginResponse = t.Object({
	token: t.String(),
});
export type loginResponse = typeof loginResponse.static;

export const loginInvalid = t.Literal("Invalid email or password");
export type loginInvalid = typeof loginInvalid.static;

export const loginFailed = t.Literal("Failed to fetch user");
export type loginFailed = typeof loginFailed.static;

export const unauthorized = t.Literal("Unauthorized");
export type unauthorized = typeof unauthorized.static;

export const forbidden = t.Literal("Forbidden");
export type forbidden = typeof forbidden.static;
