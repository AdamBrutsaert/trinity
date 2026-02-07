import * as z from "zod";

export const userResponse = z.object({
	id: z.string(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	phoneNumber: z.string().nullable(),
	address: z.string().nullable(),
	zipCode: z.string().nullable(),
	city: z.string().nullable(),
	country: z.string().nullable(),
	role: z.enum(["customer", "admin"]),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});
export type userResponse = z.infer<typeof userResponse>;

export const userNotFound = z.literal("User not found");
export type userNotFound = z.infer<typeof userNotFound>;

export const failedToFetchUser = z.literal("Failed to fetch user");
export type failedToFetchUser = z.infer<typeof failedToFetchUser>;

export const createUserBody = z.object({
	email: z.email().max(255),
	password: z.string().min(8).max(255),
	firstName: z.string().max(100),
	lastName: z.string().max(100),
	phoneNumber: z.string().max(30).optional(),
	address: z.string().optional(),
	zipCode: z.string().max(20).optional(),
	city: z.string().max(100).optional(),
	country: z.string().max(100).optional(),
	role: z.enum(["customer", "admin"]),
});
export type createUserBody = z.infer<typeof createUserBody>;

export const emailAlreadyExists = z.literal("Email already exists");
export type emailAlreadyExists = z.infer<typeof emailAlreadyExists>;

export const failedToCreateUser = z.literal("Failed to create user");
export type failedToCreateUser = z.infer<typeof failedToCreateUser>;
