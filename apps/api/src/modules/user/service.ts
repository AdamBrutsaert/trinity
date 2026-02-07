import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import bcrypt from "bcryptjs";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import { usersTable } from "../database/schema";
import type * as models from "./model";

export type CreateUserError =
	| {
			type: "email_already_exists";
			email: string;
	  }
	| {
			type: "failed_to_create_user";
	  };

export function createUser(tx: Database, params: models.createUserBody) {
	return ResultAsync.fromSafePromise(bcrypt.hash(params.password, 10)).andThen(
		(hashedPassword) => {
			return ResultAsync.fromPromise(
				tx
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
						role: params.role,
					})
					.returning({
						id: usersTable.id,
						email: usersTable.email,
						firstName: usersTable.firstName,
						lastName: usersTable.lastName,
						phoneNumber: usersTable.phoneNumber,
						address: usersTable.address,
						zipCode: usersTable.zipCode,
						city: usersTable.city,
						country: usersTable.country,
						role: usersTable.role,
						createdAt: usersTable.createdAt,
						updatedAt: usersTable.updatedAt,
					}),
				(err) =>
					errorMapper<CreateUserError>(err, {
						onConflict: () => ({
							type: "email_already_exists",
							email: params.email,
						}),
						default: () => ({
							type: "failed_to_create_user",
						}),
					}),
			).andThen((res) => {
				const user = res[0];
				if (!user) {
					return errAsync({
						type: "failed_to_create_user",
					} satisfies CreateUserError as CreateUserError);
				}
				return okAsync(user);
			});
		},
	);
}

export type GetUserByIdError =
	| {
			type: "user_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_user";
	  };

export function getUserById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.usersTable.findFirst({
			where: (usersTable, { eq }) => eq(usersTable.id, id),
			columns: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				phoneNumber: true,
				address: true,
				zipCode: true,
				city: true,
				country: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetUserByIdError>(err, {
				default: () =>
					({
						type: "failed_to_fetch_user",
					}) satisfies GetUserByIdError as GetUserByIdError,
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "user_not_found",
				id,
			} satisfies GetUserByIdError as GetUserByIdError);
		}
		return okAsync(res);
	});
}
