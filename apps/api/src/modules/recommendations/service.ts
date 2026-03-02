import { desc, eq, inArray } from "drizzle-orm";
import { ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import {
	invoiceItemsTable,
	invoicesTable,
	productsTable,
} from "../database/schema";
import type * as models from "./model";

export type GetRecommendationsError = {
	type: "failed_to_fetch_recommendations";
};

function toCents(price: unknown): number {
	if (typeof price === "number") return Math.round(price * 100);
	if (typeof price === "string") {
		const parsed = Number.parseFloat(price);
		return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
	}
	return 0;
}

type PairSupport = {
	count: number;
	seedProductId: string;
};

export function getRecommendations(tx: Database, userId: string, limit = 5) {
	return ResultAsync.fromPromise(
		(async () => {
			const recentInvoices = await tx.query.invoicesTable.findMany({
				where: (inv, { and, eq }) =>
					and(eq(inv.userId, userId), eq(inv.status, "completed")),
				columns: { id: true, createdAt: true },
				orderBy: (inv, { desc }) => [desc(inv.createdAt)],
				limit: 20,
			});

			if (!recentInvoices.length) {
				const products = await tx.query.productsTable.findMany({
					columns: { id: true, name: true, price: true },
					orderBy: (p, { desc }) => [desc(p.updatedAt)],
					limit,
				});

				return products.map((p) => ({
					id: p.id,
					name: p.name,
					reason: "Popular right now",
					unitPriceCents: toCents(p.price),
				} satisfies models.recommendationItem));
			}

			const invoiceIds = recentInvoices.map((i) => i.id);
			const items = await tx
				.select({
					invoiceId: invoiceItemsTable.invoiceId,
					productId: invoiceItemsTable.productId,
					productName: invoiceItemsTable.productName,
				})
				.from(invoiceItemsTable)
				.where(inArray(invoiceItemsTable.invoiceId, invoiceIds));

			const basketByInvoice = new Map<string, Set<string>>();
			const nameByProduct = new Map<string, string>();
			for (const item of items) {
				if (!basketByInvoice.has(item.invoiceId)) {
					basketByInvoice.set(item.invoiceId, new Set());
				}
				basketByInvoice.get(item.invoiceId)?.add(item.productId);
				if (item.productName) nameByProduct.set(item.productId, item.productName);
			}

			const lastInvoiceId = recentInvoices[0]?.id;
			const seedSet = (lastInvoiceId && basketByInvoice.get(lastInvoiceId)) || null;
			const seedProductIds = seedSet ? [...seedSet] : [];

			const supportByOther = new Map<string, PairSupport>();
			const frequency = new Map<string, number>();

			for (const basket of basketByInvoice.values()) {
				const products = [...basket];
				for (const productId of products) {
					frequency.set(productId, (frequency.get(productId) ?? 0) + 1);
				}

				if (!seedProductIds.length) continue;

				const basketHasSeed = seedProductIds.filter((seed) => basket.has(seed));
				if (!basketHasSeed.length) continue;

				for (const seed of basketHasSeed) {
					for (const other of products) {
						if (other === seed) continue;
						if (seedProductIds.includes(other)) continue;

						const prev = supportByOther.get(other);
						if (!prev) {
							supportByOther.set(other, { count: 1, seedProductId: seed });
							continue;
						}

						prev.count += 1;
					}
				}
			}

			const scored = [...supportByOther.entries()]
				.map(([productId, support]) => ({ productId, ...support }))
				.sort((a, b) => b.count - a.count);

			const recommendedIds: string[] = [];
			const reasonById = new Map<string, string>();

			for (const entry of scored) {
				if (recommendedIds.length >= limit) break;
				recommendedIds.push(entry.productId);
				const seedName = nameByProduct.get(entry.seedProductId) ?? "a recent item";
				reasonById.set(entry.productId, `Often bought with ${seedName}`);
			}

			if (recommendedIds.length < limit) {
				const seedIdSet = new Set(seedProductIds);
				const existing = new Set(recommendedIds);
				const frequent = [...frequency.entries()]
					.filter(([id]) => !seedIdSet.has(id) && !existing.has(id))
					.sort((a, b) => b[1] - a[1]);

				for (const [id] of frequent) {
					if (recommendedIds.length >= limit) break;
					recommendedIds.push(id);
					reasonById.set(id, "You buy it often");
				}
			}

			if (!recommendedIds.length) {
				const products = await tx.query.productsTable.findMany({
					columns: { id: true, name: true, price: true },
					orderBy: (p, { desc }) => [desc(p.updatedAt)],
					limit,
				});

				return products.map((p) => ({
					id: p.id,
					name: p.name,
					reason: "Recommended for you",
					unitPriceCents: toCents(p.price),
				} satisfies models.recommendationItem));
			}

			const products = await tx.query.productsTable.findMany({
				where: (p, { inArray }) => inArray(p.id, recommendedIds),
				columns: {
					id: true,
					name: true,
					price: true,
					updatedAt: true,
				},
			});

			const productById = new Map(products.map((p) => [p.id, p] as const));

			return recommendedIds
				.map((productId) => {
					const product = productById.get(productId);
					if (!product) return null;
					return {
						id: product.id,
						name: product.name,
						reason: reasonById.get(productId) ?? "Recommended for you",
						unitPriceCents: toCents(product.price),
					} satisfies models.recommendationItem;
				})
				.filter((x): x is models.recommendationItem => x !== null);
		})(),
		(err) =>
			errorMapper<GetRecommendationsError>(err, {
				default: () => ({
					type: "failed_to_fetch_recommendations",
				}),
			}),
	);
}
