import { eq, sql } from "drizzle-orm";
import { ResultAsync } from "neverthrow";

import { errorMapper } from "../../errors";
import type { Database } from "../database";
import {
	invoiceItemsTable,
	invoicesTable,
	usersTable,
} from "../database/schema";
import type * as models from "./model";

export type GenerateReportsError = {
	type: "failed_to_generate_reports";
};

export function generateReports(tx: Database) {
	return ResultAsync.fromPromise(
		(async () => {
			// Get total revenue and order counts by status
			const orderStats = await tx
				.select({
					totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${invoicesTable.status} = 'completed' THEN ${invoicesTable.totalAmount} ELSE 0 END), 0)`,
					totalOrders: sql<number>`COUNT(*)`,
					completedOrders: sql<number>`SUM(CASE WHEN ${invoicesTable.status} = 'completed' THEN 1 ELSE 0 END)`,
					pendingOrders: sql<number>`SUM(CASE WHEN ${invoicesTable.status} = 'pending' THEN 1 ELSE 0 END)`,
				})
				.from(invoicesTable);

			// Get total number of customers
			const customerCount = await tx
				.select({
					count: sql<number>`COUNT(*)`,
				})
				.from(usersTable)
				.where(eq(usersTable.role, "customer"));

			// Get top products by quantity sold
			const topProducts = await tx
				.select({
					productId: invoiceItemsTable.productId,
					productName: invoiceItemsTable.productName,
					totalQuantity: sql<number>`SUM(${invoiceItemsTable.quantity})`,
					totalRevenue: sql<string>`SUM(${invoiceItemsTable.unitPrice} * ${invoiceItemsTable.quantity})`,
				})
				.from(invoiceItemsTable)
				.leftJoin(
					invoicesTable,
					eq(invoiceItemsTable.invoiceId, invoicesTable.id),
				)
				.where(eq(invoicesTable.status, "completed"))
				.groupBy(invoiceItemsTable.productId, invoiceItemsTable.productName)
				.orderBy(sql`SUM(${invoiceItemsTable.quantity}) DESC`)
				.limit(10);

			const stats = orderStats[0];
			const totalRevenue = Number.parseFloat(stats?.totalRevenue || "0");
			const totalOrders = Number(stats?.totalOrders || 0);
			const completedOrders = Number(stats?.completedOrders || 0);
			const pendingOrders = Number(stats?.pendingOrders || 0);
			const totalCustomers = Number(customerCount[0]?.count || 0);
			const averageOrderValue =
				completedOrders > 0 ? totalRevenue / completedOrders : 0;

			return {
				totalRevenue,
				totalOrders,
				completedOrders,
				pendingOrders,
				totalCustomers,
				averageOrderValue,
				topProducts: topProducts.map((p) => ({
					productId: p.productId,
					productName: p.productName,
					totalQuantity: Number(p.totalQuantity),
					totalRevenue: Number.parseFloat(p.totalRevenue || "0"),
				})),
			} satisfies models.reportsResponse;
		})(),
		(err) =>
			errorMapper<GenerateReportsError>(err, {
				default: () => ({
					type: "failed_to_generate_reports",
				}),
			}),
	);
}
