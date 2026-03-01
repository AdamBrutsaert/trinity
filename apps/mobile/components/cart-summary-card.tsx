import { useMemo } from "react";
import { Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { styles } from "@/styles/components/cart-summary-card.styles";

function formatEur(cents: number): string {
	const value = cents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

export function CartSummaryCard({
	totalCents,
	itemsCount,
	onPurchase,
}: {
	totalCents: number;
	itemsCount: number;
	onPurchase: () => void;
}) {
	const label = useMemo(
		() => (itemsCount === 1 ? "1 item" : `${itemsCount} items`),
		[itemsCount],
	);

	return (
		<View style={styles.card}>
			<View style={styles.row}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.total}>{formatEur(totalCents)}</Text>
			</View>

			<PrimaryButton
				title="Purchase"
				onPress={onPurchase}
				disabled={itemsCount === 0}
			/>

			<Text style={styles.hint}>Payment flow is coming next.</Text>
		</View>
	);
}
