import { getFakePromos, getFakeQuickPicks } from "@/lib/fake-deals";

describe("fake-deals", () => {
	it("returns promos with discounted prices", () => {
		const promos = getFakePromos();
		expect(promos.length).toBeGreaterThan(0);

		for (const promo of promos) {
			expect(promo.id).toMatch(/^promo-/);
			expect(promo.name.length).toBeGreaterThan(0);
			expect(promo.unitPriceCents).toBeGreaterThan(0);
			expect(promo.originalUnitPriceCents).toBeGreaterThan(promo.unitPriceCents);
		}
	});

	it("returns quick picks with reasons", () => {
		const picks = getFakeQuickPicks();
		expect(picks.length).toBeGreaterThan(0);

		for (const pick of picks) {
			expect(pick.id).toMatch(/^qp-/);
			expect(pick.reason.length).toBeGreaterThan(0);
			expect(pick.unitPriceCents).toBeGreaterThan(0);
		}
	});
});
