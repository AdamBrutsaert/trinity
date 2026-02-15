import * as z from "zod";

export const registerBody = z.object({
	email: z.email().max(255),
	password: z.string().min(8).max(255),
	firstName: z.string().max(100),
	lastName: z.string().max(100),
	phoneNumber: z.string().max(30).optional(),
	address: z.string().optional(),
	zipCode: z.string().max(20).optional(),
	city: z.string().max(100).optional(),
	country: z.string().max(100).optional(),
});
export type registerBody = z.infer<typeof registerBody>;

export const registerResponse = z.object({
	token: z.string(),
});
export type registerResponse = z.infer<typeof registerResponse>;

export const emailAlreadyExists = z.literal("Email already exists");
export type emailAlreadyExists = z.infer<typeof emailAlreadyExists>;

export const failedToCreateUser = z.literal("Failed to create user");
export type failedToCreateUser = z.infer<typeof failedToCreateUser>;

export const loginBody = z.object({
	email: z.email().max(255),
	password: z.string().max(255),
});
export type loginBody = z.infer<typeof loginBody>;

export const loginResponse = z.object({
	token: z.string(),
});
export type loginResponse = z.infer<typeof loginResponse>;

export const loginInvalid = z.literal("Invalid email or password");
export type loginInvalid = z.infer<typeof loginInvalid>;

export const loginFailed = z.literal("Failed to fetch user");
export type loginFailed = z.infer<typeof loginFailed>;

export const userUnauthorized = z.literal("Unauthorized");
export type userUnauthorized = z.infer<typeof userUnauthorized>;

export const userForbidden = z.literal("Forbidden");
export type userForbidden = z.infer<typeof userForbidden>;
