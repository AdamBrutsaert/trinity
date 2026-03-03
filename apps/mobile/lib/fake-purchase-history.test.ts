import {
	getFakePurchaseDetailsById,
	getFakePurchases,
} from "@/lib/fake-purchase-history";

describe("fake-purchase-history", () => {
	it("returns a stable list of purchases", () => {
		const purchases = getFakePurchases();
		expect(purchases.length).toBeGreaterThanOrEqual(3);

		for (const purchase of purchases) {
			expect(purchase.id).toMatch(/^ord_/);
			expect(new Date(purchase.createdAtIso).toISOString()).toBe(purchase.createdAtIso);
			expect(purchase.itemsCount).toBeGreaterThan(0);
			expect(purchase.totalCents).toBeGreaterThan(0);
			expect(purchase.previewItems.length).toBeGreaterThan(0);
		}
	});

	it("returns null for unknown ids", () => {
		expect(getFakePurchaseDetailsById("does-not-exist")).toBeNull();
	});

	it("returns details for known ids and preserves base total", () => {
		const details = getFakePurchaseDetailsById("ord_1024");
		expect(details).not.toBeNull();
		if (!details) return;

		expect(details.paymentMethodLabel.length).toBeGreaterThan(0);
		expect(details.receiptNumber).toMatch(/^RCP-/);
		expect(details.lineItems.length).toBeGreaterThan(0);

		const computedTotal = details.lineItems.reduce(
			(acc, li) => acc + li.quantity * li.unitPriceCents,
			0,
		);

		// ord_1024 deliberately doesn't match the computed total exactly;
		// the helper should keep the base order's total.
		expect(details.totalCents).not.toBe(computedTotal);
		expect(details.totalCents).toBeGreaterThan(0);
	});
});
