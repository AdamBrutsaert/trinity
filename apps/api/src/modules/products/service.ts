import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import { productsTable } from "../database/schema";
import type * as models from "./models";

export type CreateProductError =
	| {
			type: "product_already_exists";
			barcode: string;
	  }
	| {
			type: "brand_not_found";
			brandId: string;
	  }
	| {
			type: "category_not_found";
			categoryId: string;
	  }
	| {
			type: "failed_to_create_product";
	  };

export function createProduct(tx: Database, body: models.createProductBody) {
	return ResultAsync.fromPromise(
		tx
			.insert(productsTable)
			.values({
				barcode: body.barcode,
				name: body.name,
				description: body.description,
				imageUrl: body.imageUrl,
				brandId: body.brandId,
				categoryId: body.categoryId,
				energyKcal: body.energyKcal,
				fat: body.fat,
				carbs: body.carbs,
				protein: body.protein,
				salt: body.salt,
			})
			.returning({
				id: productsTable.id,
				barcode: productsTable.barcode,
				name: productsTable.name,
				description: productsTable.description,
				imageUrl: productsTable.imageUrl,
				brandId: productsTable.brandId,
				categoryId: productsTable.categoryId,
				energyKcal: productsTable.energyKcal,
				fat: productsTable.fat,
				carbs: productsTable.carbs,
				protein: productsTable.protein,
				salt: productsTable.salt,
				createdAt: productsTable.createdAt,
				updatedAt: productsTable.updatedAt,
			}),
		(err) =>
			errorMapper<CreateProductError>(err, {
				onConflict: () => ({
					type: "product_already_exists",
					barcode: body.barcode,
				}),
				onForeignKeyViolation: (constraint) => {
					switch (constraint) {
						case "products_brand_id_brands_id_fk":
							return {
								type: "brand_not_found",
								brandId: body.brandId,
							};
						case "products_category_id_categories_id_fk":
							return {
								type: "category_not_found",
								categoryId: body.categoryId,
							};
						default:
							return {
								type: "failed_to_create_product",
							};
					}
				},
				default: () => ({
					type: "failed_to_create_product",
				}),
			}),
	).andThen((res) => {
		const product = res[0];
		if (!product) {
			return errAsync({
				type: "failed_to_create_product",
			} satisfies CreateProductError as CreateProductError);
		}
		return okAsync(product);
	});
}

export type GetProductByIdError =
	| {
			type: "product_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_product";
	  };

export function getProductById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.productsTable.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			columns: {
				id: true,
				barcode: true,
				name: true,
				description: true,
				imageUrl: true,
				brandId: true,
				categoryId: true,
				energyKcal: true,
				fat: true,
				carbs: true,
				protein: true,
				salt: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetProductByIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_product",
				}),
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "product_not_found",
				id,
			} satisfies GetProductByIdError as GetProductByIdError);
		}
		return okAsync(res);
	});
}

export type GetProductByBarcodeError =
	| {
			type: "product_not_found";
			barcode: string;
	  }
	| {
			type: "failed_to_fetch_product";
	  };

export function getProductByBarcode(tx: Database, barcode: string) {
	return ResultAsync.fromPromise(
		tx.query.productsTable.findFirst({
			where: (table, { eq }) => eq(table.barcode, barcode),
			columns: {
				id: true,
				barcode: true,
				name: true,
				description: true,
				imageUrl: true,
				brandId: true,
				categoryId: true,
				energyKcal: true,
				fat: true,
				carbs: true,
				protein: true,
				salt: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetProductByBarcodeError>(err, {
				default: () => ({
					type: "failed_to_fetch_product",
				}),
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "product_not_found",
				barcode,
			} satisfies GetProductByBarcodeError as GetProductByBarcodeError);
		}
		return okAsync(res);
	});
}

export type GetProductsError = {
	type: "failed_to_fetch_products";
};

export function getProducts(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.productsTable.findMany({
			columns: {
				id: true,
				barcode: true,
				name: true,
				description: true,
				imageUrl: true,
				brandId: true,
				categoryId: true,
				energyKcal: true,
				fat: true,
				carbs: true,
				protein: true,
				salt: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetProductsError>(err, {
				default: () => ({
					type: "failed_to_fetch_products",
				}),
			}),
	);
}

export type UpdateProductError =
	| {
			type: "product_not_found";
			id: string;
	  }
	| {
			type: "product_already_exists";
			barcode: string;
	  }
	| {
			type: "brand_not_found";
			brandId: string;
	  }
	| {
			type: "category_not_found";
			categoryId: string;
	  }
	| {
			type: "failed_to_update_product";
	  };

export function updateProduct(
	tx: Database,
	id: string,
	body: models.updateProductBody,
) {
	return ResultAsync.fromPromise(
		tx
			.update(productsTable)
			.set({
				barcode: body.barcode,
				name: body.name,
				description: body.description,
				imageUrl: body.imageUrl,
				brandId: body.brandId,
				categoryId: body.categoryId,
				energyKcal: body.energyKcal,
				fat: body.fat,
				carbs: body.carbs,
				protein: body.protein,
				salt: body.salt,
				updatedAt: new Date(),
			})
			.where(eq(productsTable.id, id))
			.returning({
				id: productsTable.id,
				barcode: productsTable.barcode,
				name: productsTable.name,
				description: productsTable.description,
				imageUrl: productsTable.imageUrl,
				brandId: productsTable.brandId,
				categoryId: productsTable.categoryId,
				energyKcal: productsTable.energyKcal,
				fat: productsTable.fat,
				carbs: productsTable.carbs,
				protein: productsTable.protein,
				salt: productsTable.salt,
				createdAt: productsTable.createdAt,
				updatedAt: productsTable.updatedAt,
			}),
		(err) =>
			errorMapper<UpdateProductError>(err, {
				onConflict: () => ({
					type: "product_already_exists",
					barcode: body.barcode,
				}),
				onForeignKeyViolation: (constraint) => {
					switch (constraint) {
						case "products_brand_id_brands_id_fk":
							return {
								type: "brand_not_found",
								brandId: body.brandId,
							};
						case "products_category_id_categories_id_fk":
							return {
								type: "category_not_found",
								categoryId: body.categoryId,
							};
						default:
							return {
								type: "failed_to_update_product",
							};
					}
				},
				default: () => ({
					type: "failed_to_update_product",
				}),
			}),
	).andThen((res) => {
		const product = res[0];
		if (!product) {
			return errAsync({
				type: "product_not_found",
				id,
			} satisfies UpdateProductError as UpdateProductError);
		}
		return okAsync(product);
	});
}

export type DeleteProductError =
	| {
			type: "product_not_found";
			id: string;
	  }
	| {
			type: "failed_to_delete_product";
	  };

export function deleteProduct(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(productsTable)
			.where(eq(productsTable.id, id))
			.returning({ id: productsTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_product",
			} satisfies DeleteProductError as DeleteProductError;
		},
	).andThen((res) => {
		if (res.length === 0) {
			return errAsync({
				type: "product_not_found",
				id,
			} satisfies DeleteProductError as DeleteProductError);
		}
		return okAsync();
	});
}
