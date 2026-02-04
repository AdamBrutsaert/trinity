import bcrypt from "bcryptjs";
import { status } from "elysia";
import { SignJWT } from "jose";
import { db } from "../../db";
import { AuthModel } from "./model";

export abstract class Auth {
	static saltRounds = 10;
	static secret = import.meta.env.JWT_SECRET!;

	static async login({ email, password }: AuthModel.loginBody) {
		// Query user by email
		const user = await db.query.usersTable.findFirst({
			where: (usersTable, { eq }) => eq(usersTable.email, email),
		});
		if (!user) {
			throw status(
				401,
				"Invalid email or password" satisfies AuthModel.loginInvalid,
			);
		}

		// Verify password
		const match = await bcrypt.compare(password, user.passwordHash);
		if (!match) {
			throw status(
				401,
				"Invalid email or password" satisfies AuthModel.loginInvalid,
			);
		}

		// Generate JWT Token
		const token = await new SignJWT({ userId: user.id })
			.setProtectedHeader({ alg: "HS256" })
			.setIssuedAt()
			.setExpirationTime("2h")
			.setIssuer("trinity")
			.sign(new TextEncoder().encode(Auth.secret));

		// Return token
		return { token };
	}
}
