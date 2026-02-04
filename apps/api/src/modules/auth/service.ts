import { db } from "@/db";
import { env } from "@/env";
import bcrypt from "bcryptjs";
import { status } from "elysia";
import { SignJWT } from "jose";
import type * as models from "./model";

export async function login({ email, password }: models.loginBody) {
	const user = await db.query.usersTable.findFirst({
		where: (usersTable, { eq }) => eq(usersTable.email, email),
	});
	if (!user) {
		throw status(
			401,
			"Invalid email or password" satisfies models.loginInvalid,
		);
	}

	// Verify password
	const match = await bcrypt.compare(password, user.passwordHash);
	if (!match) {
		throw status(
			401,
			"Invalid email or password" satisfies models.loginInvalid,
		);
	}

	// Generate JWT Token
	const token = await new SignJWT({ userId: user.id })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.setIssuer("trinity")
		.sign(new TextEncoder().encode(env.JWT_SECRET));

	// Return token
	return { token };
}
