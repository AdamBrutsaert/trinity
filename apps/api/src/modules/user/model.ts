import { t } from "elysia";

export const userResponse = t.Object({
	id: t.String(),
	email: t.String(),
	firstName: t.String(),
	lastName: t.String(),
	phoneNumber: t.Nullable(t.String()),
	address: t.Nullable(t.String()),
	zipCode: t.Nullable(t.String()),
	city: t.Nullable(t.String()),
	country: t.Nullable(t.String()),
	role: t.UnionEnum(["customer", "admin"]),
});
export type userResponse = typeof userResponse.static;

export const userNotFound = t.Literal("User not found");
export type userNotFound = typeof userNotFound.static;

export const failedToFetchUser = t.Literal("Failed to fetch user");
export type failedToFetchUser = typeof failedToFetchUser.static;

export const createUserBody = t.Object({
	email: t.String({ format: "email", maxLength: 255 }),
	password: t.String({ minLength: 8, maxLength: 255 }),
	firstName: t.String({ maxLength: 100 }),
	lastName: t.String({ maxLength: 100 }),
	phoneNumber: t.Optional(t.String({ maxLength: 30 })),
	address: t.Optional(t.String()),
	zipCode: t.Optional(t.String({ maxLength: 20 })),
	city: t.Optional(t.String({ maxLength: 100 })),
	country: t.Optional(t.String({ maxLength: 100 })),
	role: t.UnionEnum(["customer", "admin"]),
});
export type createUserBody = typeof createUserBody.static;

export const emailAlreadyExists = t.Literal("Email already exists");
export type emailAlreadyExists = typeof emailAlreadyExists.static;

export const failedToCreateUser = t.Literal("Failed to create user");
export type failedToCreateUser = typeof failedToCreateUser.static;
