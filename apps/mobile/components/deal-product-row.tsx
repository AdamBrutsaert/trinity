import { useMemo } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { styles } from "@/styles/components/deal-product-row.styles";

export type DealProductRowModel = {
	id: string;
	name: string;
	subtitle: string;
	unitPriceCents: number;
	originalUnitPriceCents?: number;
};

function formatEur(cents: number): string {
	const value = cents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

function discountPercent(unit: number, original: number): number {
	if (!original || original <= 0) return 0;
	const pct = Math.round(((original - unit) / original) * 100);
	return Math.max(0, Math.min(90, pct));
}

export function DealProductRow({
	item,
	actionLabel = "Add",
	onPressAction,
}: {
	item: DealProductRowModel;
	actionLabel?: string;
	onPressAction: (item: DealProductRowModel) => void;
}) {
	const priceLabel = useMemo(
		() => formatEur(item.unitPriceCents),
		[item.unitPriceCents],
	);
	const originalLabel = useMemo(
		() =>
			typeof item.originalUnitPriceCents === "number"
				? formatEur(item.originalUnitPriceCents)
				: null,
		[item.originalUnitPriceCents],
	);

	const promoPct = useMemo(() => {
		if (typeof item.originalUnitPriceCents !== "number") return 0;
		return discountPercent(item.unitPriceCents, item.originalUnitPriceCents);
	}, [item.originalUnitPriceCents, item.unitPriceCents]);

	return (
		<View style={styles.row}>
			<View style={styles.left}>
				<View style={styles.titleRow}>
					<Text style={styles.title} numberOfLines={1}>
						{item.name}
					</Text>
					{promoPct ? (
						<View style={styles.discountPill}>
							<Text style={styles.discountText}>-{promoPct}%</Text>
						</View>
					) : null}
				</View>
				<Text style={styles.subtitle} numberOfLines={1}>
					{item.subtitle}
				</Text>
			</View>

			<View style={styles.right}>
				<View style={styles.priceRow}>
					<Text style={styles.price}>{priceLabel}</Text>
					{originalLabel ? (
						<Text style={styles.originalPrice}>{originalLabel}</Text>
					) : null}
				</View>
				<View style={styles.buttonWrap}>
					<PrimaryButton
						title={actionLabel}
						onPress={() => onPressAction(item)}
					/>
				</View>
			</View>
		</View>
	);
}
