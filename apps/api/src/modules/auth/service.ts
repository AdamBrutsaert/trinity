import type { Database } from "@/db";
import { usersTable } from "@/db/schema";
import { env } from "@/env";
import { errorMapper } from "@/errors";
import bcrypt from "bcryptjs";
import { status } from "elysia";
import { SignJWT } from "jose";
import type * as models from "./model";

function generateToken(userId: string) {
	return new SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.setIssuer("trinity")
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}

export async function register(tx: Database, params: models.registerBody) {
	const hashedPassword = await bcrypt.hash(params.password, 10);

	const result = await tx
		.insert(usersTable)
		.values({
			email: params.email,
			passwordHash: hashedPassword,
			firstName: params.firstName,
			lastName: params.lastName,
			phoneNumber: params.phoneNumber,
			address: params.address,
			zipCode: params.zipCode,
			city: params.city,
			country: params.country,
		})
		.returning({ id: usersTable.id })
		.catch((err) =>
			errorMapper(err, {
				onConflict: () =>
					status(
						409,
						"Email already exists" satisfies models.registerEmailExists,
					),
			}),
		);

	const user = result[0];
	if (!user) {
		throw status(500, "Failed to create user" satisfies models.registerFailed);
	}

	return { token: await generateToken(user.id) };
}

export async function login(
	tx: Database,
	{ email, password }: models.loginBody,
) {
	const user = await tx.query.usersTable.findFirst({
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

	// Return token
	return { token: await generateToken(user.id) };
}
