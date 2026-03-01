import { useMemo } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import ScanBarcodeIcon from "@/assets/svg/scan-barcode.svg";

import { styles } from "../styles/components/cart-overview-card.styles";

function formatEur(cents: number): string {
	const value = cents / 100;
	return new Intl.NumberFormat("fr-FR", {
		style: "currency",
		currency: "EUR",
	}).format(value);
}

export function CartOverviewCard({
	totalCents,
	itemsCount,
	onScanMore,
}: {
	totalCents: number;
	itemsCount: number;
	onScanMore: () => void;
}) {
	const itemsLabel = useMemo(
		() => (itemsCount === 1 ? "1 item in cart" : `${itemsCount} items in cart`),
		[itemsCount],
	);

	return (
		<View style={styles.card}>
			<View style={styles.row}>
				<View style={styles.leftCol}>
					<View>
						<Text style={styles.label}>CART OVERVIEW</Text>
						<Text style={styles.total}>{formatEur(totalCents)}</Text>
						<Text style={styles.items}>{itemsLabel}</Text>
					</View>

					<TouchableOpacity
						accessibilityRole="button"
						style={styles.scanPill}
						onPress={onScanMore}
						activeOpacity={0.85}
					>
						<ScanBarcodeIcon width={16} height={16} color="#fff" />
						<Text style={styles.scanPillText}>Scan more</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.rightCol}>
					<Text style={styles.tipTitle}>TIP</Text>
					<Text style={styles.tipText}>
						For faster scans, keep the barcode{" "}
						<Text style={styles.tipEmphasis}>flat</Text> and use{" "}
						<Text style={styles.tipEmphasis}>good lighting</Text>.
					</Text>
				</View>
			</View>
		</View>
	);
}
