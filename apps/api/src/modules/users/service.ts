import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import { usersTable } from "@/modules/database/schema";

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
				default: () => ({
					type: "failed_to_fetch_user",
				}),
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

export type GetUsersError = {
	type: "failed_to_fetch_users";
};

export function getUsers(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.usersTable.findMany({
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
			errorMapper<GetUsersError>(err, {
				default: () => ({
					type: "failed_to_fetch_users",
				}),
			}),
	);
}

export type UpdateUserError =
	| {
			type: "user_not_found";
			id: string;
	  }
	| {
			type: "email_already_exists";
			email: string;
	  }
	| {
			type: "failed_to_update_user";
	  };

export function updateUser(
	tx: Database,
	id: string,
	params: models.updateUserBody,
) {
	return ResultAsync.fromSafePromise(bcrypt.hash(params.password, 10)).andThen(
		(hashedPassword) => {
			return ResultAsync.fromPromise(
				tx
					.update(usersTable)
					.set({
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
						updatedAt: new Date(),
					})
					.where(eq(usersTable.id, id))
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
					errorMapper<UpdateUserError>(err, {
						onConflict: () => ({
							type: "email_already_exists",
							email: params.email,
						}),
						default: () => ({
							type: "failed_to_update_user",
						}),
					}),
			).andThen((res) => {
				const user = res[0];
				if (!user) {
					return errAsync({
						type: "user_not_found",
						id: id,
					} satisfies UpdateUserError as UpdateUserError);
				}
				return okAsync(user);
			});
		},
	);
}

export type DeleteUserError =
	| {
			type: "failed_to_delete_user";
	  }
	| {
			type: "user_not_found";
			id: string;
	  };

export function deleteUser(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(usersTable)
			.where(eq(usersTable.id, id))
			.returning({ id: usersTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_user",
			} satisfies DeleteUserError as DeleteUserError;
		},
	).andThen((res) => {
		if (res.length === 0) {
			return errAsync({
				type: "user_not_found",
				id,
			} satisfies DeleteUserError as DeleteUserError);
		}
		return okAsync();
	});
}
