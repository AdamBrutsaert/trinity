import { desc, eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import { categoriesTable, productsTable } from "../database/schema";
import type * as models from "./model";

export type GetDealsError = {
	type: "failed_to_fetch_deals";
};

function toCents(price: unknown): number {
	if (typeof price === "number") return Math.round(price * 100);
	if (typeof price === "string") {
		const parsed = Number.parseFloat(price);
		return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
	}
	return 0;
}

function applyDiscountCents(originalCents: number, percent: number): number {
	const safePercent = Math.max(0, Math.min(90, percent));
	return Math.max(0, Math.round(originalCents * (1 - safePercent / 100)));
}

const DEFAULT_DISCOUNTS = [20, 15, 10, 25, 12, 18, 8, 30];

export function getDeals(tx: Database, limit = 6) {
	return ResultAsync.fromPromise(
		(async () => {
			const rows = await tx
				.select({
					id: productsTable.id,
					name: productsTable.name,
					price: productsTable.price,
					categoryLabel: categoriesTable.name,
				})
				.from(productsTable)
				.leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
				.orderBy(desc(productsTable.updatedAt))
				.limit(limit);

			return rows.map((row, index) => {
				const originalUnitPriceCents = toCents(row.price);
				const discount = DEFAULT_DISCOUNTS[index % DEFAULT_DISCOUNTS.length] ?? 10;
				const unitPriceCents = applyDiscountCents(originalUnitPriceCents, discount);

				return {
					id: row.id,
					name: row.name,
					categoryLabel: row.categoryLabel ?? "",
					unitPriceCents,
					originalUnitPriceCents,
				} satisfies models.dealPromoItem;
			});
		})(),
		(err) =>
			errorMapper<GetDealsError>(err, {
				default: () => ({
					type: "failed_to_fetch_deals",
				}),
			}),
	);
}
