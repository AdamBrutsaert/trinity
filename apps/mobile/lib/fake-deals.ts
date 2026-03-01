export type DealPromoItem = {
	id: string;
	name: string;
	categoryLabel: string;
	unitPriceCents: number;
	originalUnitPriceCents: number;
};

export type DealQuickPickItem = {
	id: string;
	name: string;
	reason: string;
	unitPriceCents: number;
};

export function getFakePromos(): DealPromoItem[] {
	return [
		{
			id: "promo-1",
			name: "Coffee beans",
			categoryLabel: "Breakfast",
			unitPriceCents: 699,
			originalUnitPriceCents: 899,
		},
		{
			id: "promo-2",
			name: "Almond milk",
			categoryLabel: "Dairy alternatives",
			unitPriceCents: 279,
			originalUnitPriceCents: 319,
		},
		{
			id: "promo-3",
			name: "Whole wheat pasta",
			categoryLabel: "Pantry",
			unitPriceCents: 199,
			originalUnitPriceCents: 239,
		},
		{
			id: "promo-4",
			name: "Greek yogurt",
			categoryLabel: "Fresh",
			unitPriceCents: 139,
			originalUnitPriceCents: 159,
		},
		{
			id: "promo-5",
			name: "Olive oil",
			categoryLabel: "Pantry",
			unitPriceCents: 899,
			originalUnitPriceCents: 1099,
		},
		{
			id: "promo-6",
			name: "Sparkling water",
			categoryLabel: "Drinks",
			unitPriceCents: 249,
			originalUnitPriceCents: 275,
		},
	];
}

export function getFakeQuickPicks(): DealQuickPickItem[] {
	return [
		{
			id: "qp-1",
			name: "Bananas",
			reason: "You buy them often",
			unitPriceCents: 170,
		},
		{
			id: "qp-2",
			name: "Eggs",
			reason: "Goes well with your usual baskets",
			unitPriceCents: 249,
		},
		{
			id: "qp-3",
			name: "Tomatoes",
			reason: "Trending this week",
			unitPriceCents: 149,
		},
		{
			id: "qp-4",
			name: "Rice",
			reason: "Based on your purchase history",
			unitPriceCents: 299,
		},
		{
			id: "qp-5",
			name: "Chocolate",
			reason: "Because you deserve it",
			unitPriceCents: 349,
		},
	];
}
