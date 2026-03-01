import { useMemo } from "react";
import {
	type LayoutChangeEvent,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/primary-button";
import { styles } from "@/styles/components/history-order-actions-bar.styles";

export function HistoryOrderActionsBar({
	onClose,
	onReorder,
	canReorder,
	onLayout,
}: {
	onClose: () => void;
	onReorder: () => void;
	canReorder: boolean;
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
					<TouchableOpacity
						accessibilityRole="button"
						activeOpacity={0.85}
						style={styles.closePill}
						onPress={onClose}
					>
						<Text style={styles.closeText}>Close</Text>
					</TouchableOpacity>

					<View style={styles.buttonWrap}>
						<PrimaryButton
							title="Reorder"
							onPress={onReorder}
							disabled={!canReorder}
						/>
					</View>
				</View>
			</View>
		</View>
	);
}
