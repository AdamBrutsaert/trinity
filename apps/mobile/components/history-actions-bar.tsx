import { useMemo } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CartIcon from "@/assets/svg/cart.svg";
import ScanBarcodeIcon from "@/assets/svg/scan-barcode.svg";
import { ActionButton } from "@/components/action-button";
import { styles } from "@/styles/components/history-actions-bar.styles";

export function HistoryActionsBar({
	onScan,
	onCart,
	onLayout,
}: {
	onScan: () => void;
	onCart: () => void;
	onLayout: (e: LayoutChangeEvent) => void;
}) {
	const insets = useSafeAreaInsets();
	const bottom = useMemo(
		() => Math.max(12, insets.bottom + 10),
		[insets.bottom],
	);

	return (
		<View style={[styles.wrapper, { bottom }]} onLayout={onLayout}>
			<View style={styles.card}>
				<View style={styles.row}>
					<ActionButton
						title="Scan"
						subtitle="Product"
						onPress={onScan}
						Icon={ScanBarcodeIcon}
						iconColor="#fff"
					/>
					<ActionButton
						title="Cart"
						subtitle="View"
						onPress={onCart}
						Icon={CartIcon}
						iconColor="#fff"
					/>
				</View>
			</View>
		</View>
	);
}
