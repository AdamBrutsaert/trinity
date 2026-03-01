import React, { useMemo } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { styles } from "@/styles/components/cart-purchase-bar.styles";

function formatEur(cents: number): string {
	const value = cents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

export function CartPurchaseBar({
	totalCents,
	itemsCount,
	bottomInset,
	onPurchase,
	onLayout,
}: {
	totalCents: number;
	itemsCount: number;
	bottomInset: number;
	onPurchase: () => void;
	onLayout: (e: LayoutChangeEvent) => void;
}) {
	const bottom = useMemo(() => Math.max(12, bottomInset + 10), [bottomInset]);

	return (
		<View style={[styles.wrapper, { bottom }]} onLayout={onLayout}>
			<View style={styles.bar}>
				<View style={styles.row}>
					<View style={styles.left}>
						<Text style={styles.label}>TOTAL</Text>
						<Text style={styles.total}>{formatEur(totalCents)}</Text>
					</View>

					<View style={styles.buttonWrap}>
						<PrimaryButton
							title="Purchase"
							onPress={onPurchase}
							disabled={itemsCount === 0}
						/>
					</View>
				</View>
			</View>
		</View>
	);
}
