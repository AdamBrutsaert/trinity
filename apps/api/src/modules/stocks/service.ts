import { errorMapper } from "@/errors";
import type { Database } from "@/modules/database";
import { stocksTable } from "@/modules/database/schema";
import { eq } from "drizzle-orm";
import { errAsync, okAsync, ResultAsync } from "neverthrow";
import type * as models from "./models";

export type CreateStockError =
	| {
			type: "product_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_create_stock";
	  };

export function createStock(tx: Database, body: models.createStockBody) {
	return ResultAsync.fromPromise(
		tx
			.insert(stocksTable)
			.values({
				productId: body.productId,
				price: body.price,
				quantity: body.quantity,
			})
			.returning({
				id: stocksTable.id,
				productId: stocksTable.productId,
				price: stocksTable.price,
				quantity: stocksTable.quantity,
				createdAt: stocksTable.createdAt,
				updatedAt: stocksTable.updatedAt,
			}),
		(err) =>
			errorMapper<CreateStockError>(err, {
				onForeignKeyViolation: (constraint) => {
					switch (constraint) {
						case "stocks_product_id_products_id_fk":
							return {
								type: "product_not_found",
								productId: body.productId,
							};
						default:
							return {
								type: "failed_to_create_stock",
							};
					}
				},
				default: () => ({
					type: "failed_to_create_stock",
				}),
			}),
	).andThen((res) => {
		const stock = res[0];
		if (!stock) {
			return errAsync({
				type: "failed_to_create_stock",
			} satisfies CreateStockError as CreateStockError);
		}
		return okAsync(stock);
	});
}

export type GetStockByIdError =
	| {
			type: "stock_not_found";
			id: string;
	  }
	| {
			type: "failed_to_fetch_stock";
	  };

export function getStockById(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx.query.stocksTable.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			columns: {
				id: true,
				productId: true,
				price: true,
				quantity: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetStockByIdError>(err, {
				default: () => ({
					type: "failed_to_fetch_stock",
				}),
			}),
	).andThen((res) => {
		if (!res) {
			return errAsync({
				type: "stock_not_found",
				id,
			} satisfies GetStockByIdError as GetStockByIdError);
		}
		return okAsync(res);
	});
}

export type GetStocksError = {
	type: "failed_to_fetch_stocks";
};

export function getStocks(tx: Database) {
	return ResultAsync.fromPromise(
		tx.query.stocksTable.findMany({
			columns: {
				id: true,
				productId: true,
				price: true,
				quantity: true,
				createdAt: true,
				updatedAt: true,
			},
		}),
		(err) =>
			errorMapper<GetStocksError>(err, {
				default: () => ({
					type: "failed_to_fetch_stocks",
				}),
			}),
	);
}

export type UpdateStockError =
	| {
			type: "stock_not_found";
			id: string;
	  }
	| {
			type: "product_not_found";
			productId: string;
	  }
	| {
			type: "failed_to_update_stock";
	  };

export function updateStock(
	tx: Database,
	id: string,
	body: models.updateStockBody,
) {
	return ResultAsync.fromPromise(
		tx
			.update(stocksTable)
			.set({
				productId: body.productId,
				price: body.price,
				quantity: body.quantity,
				updatedAt: new Date(),
			})
			.where(eq(stocksTable.id, id))
			.returning({
				id: stocksTable.id,
				productId: stocksTable.productId,
				price: stocksTable.price,
				quantity: stocksTable.quantity,
				createdAt: stocksTable.createdAt,
				updatedAt: stocksTable.updatedAt,
			}),
		(err) =>
			errorMapper<UpdateStockError>(err, {
				onForeignKeyViolation: (constraint) => {
					switch (constraint) {
						case "stocks_product_id_products_id_fk":
							return {
								type: "product_not_found",
								productId: body.productId,
							};
						default:
							return {
								type: "failed_to_update_stock",
							};
					}
				},
				default: () => ({
					type: "failed_to_update_stock",
				}),
			}),
	).andThen((res) => {
		const stock = res[0];
		if (!stock) {
			return errAsync({
				type: "stock_not_found",
				id,
			} satisfies UpdateStockError as UpdateStockError);
		}
		return okAsync(stock);
	});
}

export type DeleteStockError =
	| {
			type: "stock_not_found";
			id: string;
	  }
	| {
			type: "failed_to_delete_stock";
	  };

export function deleteStock(tx: Database, id: string) {
	return ResultAsync.fromPromise(
		tx
			.delete(stocksTable)
			.where(eq(stocksTable.id, id))
			.returning({ id: stocksTable.id }),
		(_err) => {
			return {
				type: "failed_to_delete_stock",
			} satisfies DeleteStockError as DeleteStockError;
		},
	).andThen((res) => {
		if (res.length === 0) {
			return errAsync({
				type: "stock_not_found",
				id,
			} satisfies DeleteStockError as DeleteStockError);
		}
		return okAsync();
	});
}
