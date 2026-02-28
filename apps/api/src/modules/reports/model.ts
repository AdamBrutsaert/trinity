import * as z from "zod";

export const topProductSchema = z.object({
	productId: z.string(),
	productName: z.string(),
	totalQuantity: z.number().int(),
	totalRevenue: z.number(),
});

export const reportsResponseSchema = z.object({
	totalRevenue: z.number(),
	totalOrders: z.number().int(),
	completedOrders: z.number().int(),
	pendingOrders: z.number().int(),
	totalCustomers: z.number().int(),
	topProducts: z.array(topProductSchema),
	averageOrderValue: z.number(),
});

export type reportsResponse = z.infer<typeof reportsResponseSchema>;
export type topProduct = z.infer<typeof topProductSchema>;

export const failedToGenerateReports = z.literal("Failed to generate reports");
export type failedToGenerateReports = z.infer<typeof failedToGenerateReports>;

export const userUnauthorized = z.literal("Unauthorized");
export type userUnauthorized = z.infer<typeof userUnauthorized>;

export const userForbidden = z.literal("Forbidden");
export type userForbidden = z.infer<typeof userForbidden>;
