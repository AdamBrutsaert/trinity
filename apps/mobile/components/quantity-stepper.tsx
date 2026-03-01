import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/quantity-stepper.styles";

export function QuantityStepper({
	value,
	minValue = 1,
	onChange,
}: {
	value: number;
	minValue?: number;
	onChange: (next: number) => void;
}) {
	const canDecrement = value > minValue;

	return (
		<View style={styles.stepper}>
			<TouchableOpacity
				accessibilityRole="button"
				style={[styles.button, !canDecrement ? styles.buttonDisabled : null]}
				onPress={() => {
					if (!canDecrement) return;
					onChange(value - 1);
				}}
				activeOpacity={0.85}
				disabled={!canDecrement}
			>
				<Text style={styles.buttonText}>−</Text>
			</TouchableOpacity>

			<Text style={styles.value}>{value}</Text>

			<TouchableOpacity
				accessibilityRole="button"
				style={styles.button}
				onPress={() => onChange(value + 1)}
				activeOpacity={0.85}
			>
				<Text style={styles.buttonText}>+</Text>
			</TouchableOpacity>
		</View>
	);
}
