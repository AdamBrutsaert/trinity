import z from "zod";

export const dealPromoItem = z.object({
	// productId
	id: z.uuidv4(),
	name: z.string(),
	categoryLabel: z.string(),
	unitPriceCents: z.number().int().nonnegative(),
	originalUnitPriceCents: z.number().int().nonnegative(),
});
export type dealPromoItem = z.infer<typeof dealPromoItem>;

export const dealsResponse = z.array(dealPromoItem);
export type dealsResponse = z.infer<typeof dealsResponse>;

export const failedToFetchDeals = z.literal("Failed to fetch deals");
export type failedToFetchDeals = z.infer<typeof failedToFetchDeals>;
