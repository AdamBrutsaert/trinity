import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import { brandsTable } from "@/modules/database/schema";

export type CreateBrandError =
	| {
			type: "brand_name_already_exists";
			name: string;
	  }
	| {
			type: "failed_to_create_brand";
	  };

export function createBrand(tx: Database, name: string) {
	return ResultAsync.fromPromise(
		tx.insert(brandsTable).values({ name }).returning({
			id: brandsTable.id,
			name: brandsTable.name,
			createdAt: brandsTable.createdAt,
			updatedAt: brandsTable.updatedAt,
		}),
		(err) =>
			errorMapper<CreateBrandError>(err, {
				onConflict: () => ({
					type: "brand_name_already_exists",
					name,
				}),
				default: () => ({
					type: "failed_to_create_brand",
				}),
			}),
	).andThen((res) => {
		const brand = res[0];
		if (!brand) {
			return errAsync({
				type: "failed_to_create_brand",
			} satisfies CreateBrandError as CreateBrandError);
		}
		return okAsync(brand);
	});
}

export type GetBrandByIdError =
	| {
			type: "brand_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_brand";
	  };

export function getBrandById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.brandsTable.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetBrandByIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_brand",
				}),
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "brand_not_found",
				id,
			} satisfies GetBrandByIdError as GetBrandByIdError);
		}
		return okAsync(res);
	});
}

export type GetBrandsError = {
	type: "failed_to_fetch_brands";
};

export function getBrands(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.brandsTable.findMany({
			columns: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetBrandsError>(err, {
				default: () => ({
					type: "failed_to_fetch_brands",
				}),
			}),
	);
}

export type UpdateBrandError =
	| {
			type: "brand_not_found";
			id: string;
	  }
	| {
			type: "brand_name_already_exists";
			name: string;
	  }
	| {
			type: "failed_to_update_brand";
	  };

export function updateBrand(tx: Database, id: string, name: string) {
	return ResultAsync.fromPromise(
		tx
			.update(brandsTable)
			.set({
				name,
				updatedAt: new Date(),
			})
			.where(eq(brandsTable.id, id))
			.returning({
				id: brandsTable.id,
				name: brandsTable.name,
				createdAt: brandsTable.createdAt,
				updatedAt: brandsTable.updatedAt,
			}),
		(err) =>
			errorMapper<UpdateBrandError>(err, {
				onConflict: () => ({
					type: "brand_name_already_exists",
					name,
				}),
				default: () => ({
					type: "failed_to_update_brand",
				}),
			}),
	).andThen((res) => {
		const brand = res[0];
		if (!brand) {
			return errAsync({
				type: "brand_not_found",
				id,
			} satisfies UpdateBrandError as UpdateBrandError);
		}
		return okAsync(brand);
	});
}

export type DeleteBrandError =
	| {
			type: "brand_not_found";
			id: string;
	  }
	| {
			type: "failed_to_delete_brand";
	  };

export function deleteBrand(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(brandsTable)
			.where(eq(brandsTable.id, id))
			.returning({ id: brandsTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_brand",
			} satisfies DeleteBrandError as DeleteBrandError;
		},
	).andThen((res) => {
		if (res.length === 0) {
			return errAsync({
				type: "brand_not_found",
				id,
			} satisfies DeleteBrandError as DeleteBrandError);
		}
		return okAsync();
	});
}
