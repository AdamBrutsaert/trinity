import z from "zod";

export const recommendationItem = z.object({
	// productId
	id: z.uuidv4(),
	name: z.string(),
	reason: z.string(),
	unitPriceCents: z.number().int().nonnegative(),
});
export type recommendationItem = z.infer<typeof recommendationItem>;

export const recommendationsResponse = z.array(recommendationItem);
export type recommendationsResponse = z.infer<typeof recommendationsResponse>;

export const failedToFetchRecommendations = z.literal(
	"Failed to fetch recommendations",
);
export type failedToFetchRecommendations = z.infer<
	typeof failedToFetchRecommendations
>;
