import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import { categoriesTable } from "@/modules/database/schema";

export type CreateCategoryError =
	| {
			type: "category_name_already_exists";
			name: string;
	  }
	| {
			type: "failed_to_create_category";
	  };

export function createCategory(tx: Database, name: string) {
	return ResultAsync.fromPromise(
		tx.insert(categoriesTable).values({ name }).returning({
			id: categoriesTable.id,
			name: categoriesTable.name,
			createdAt: categoriesTable.createdAt,
			updatedAt: categoriesTable.updatedAt,
		}),
		(err) =>
			errorMapper<CreateCategoryError>(err, {
				onConflict: () => ({
					type: "category_name_already_exists",
					name,
				}),
				default: () => ({
					type: "failed_to_create_category",
				}),
			}),
	).andThen((res) => {
		const brand = res[0];
		if (!brand) {
			return errAsync({
				type: "failed_to_create_category",
			} satisfies CreateCategoryError as CreateCategoryError);
		}
		return okAsync(brand);
	});
}

export type GetCategoryByIdError =
	| {
			type: "category_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_category";
	  };

export function getCategoryById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.categoriesTable.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetCategoryByIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_category",
				}),
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "category_not_found",
				id,
			} satisfies GetCategoryByIdError as GetCategoryByIdError);
		}
		return okAsync(res);
	});
}

export type GetCategoriesError = {
	type: "failed_to_fetch_categories";
};

export function getCategories(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.categoriesTable.findMany({
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetCategoriesError>(err, {
				default: () => ({
					type: "failed_to_fetch_categories",
				}),
			}),
	);
}

export type UpdateCategoryError =
	| {
			type: "category_not_found";
			id: string;
	  }
	| {
			type: "category_name_already_exists";
			name: string;
	  }
	| {
			type: "failed_to_update_category";
	  };

export function updateCategory(tx: Database, id: string, name: string) {
	return ResultAsync.fromPromise(
		tx
			.update(categoriesTable)
			.set({
				name,
				updatedAt: new Date(),
			})
			.where(eq(categoriesTable.id, id))
			.returning({
				id: categoriesTable.id,
				name: categoriesTable.name,
				createdAt: categoriesTable.createdAt,
				updatedAt: categoriesTable.updatedAt,
			}),
		(err) =>
			errorMapper<UpdateCategoryError>(err, {
				onConflict: () => ({
					type: "category_name_already_exists",
					name,
				}),
				default: () => ({
					type: "failed_to_update_category",
				}),
			}),
	).andThen((res) => {
		const brand = res[0];
		if (!brand) {
			return errAsync({
				type: "category_not_found",
				id,
			} satisfies UpdateCategoryError as UpdateCategoryError);
		}
		return okAsync(brand);
	});
}

export type DeleteCategoryError =
	| {
			type: "category_not_found";
			id: string;
	  }
	| {
			type: "failed_to_delete_category";
	  };

export function deleteCategory(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(categoriesTable)
			.where(eq(categoriesTable.id, id))
			.returning({ id: categoriesTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_category",
			} satisfies DeleteCategoryError as DeleteCategoryError;
		},
	).andThen((res) => {
		if (res.length === 0) {
			return errAsync({
				type: "category_not_found",
				id,
			} satisfies DeleteCategoryError as DeleteCategoryError);
		}
		return okAsync();
	});
}
