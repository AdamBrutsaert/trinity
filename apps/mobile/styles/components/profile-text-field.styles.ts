import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	field: {
		gap: 8,
	},
	label: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
	},
	input: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#EFEFF3",
		borderRadius: 14,
		paddingVertical: 12,
		paddingHorizontal: 14,
		fontSize: 14,
		color: "#111",
	},
	inputDisabled: {
		opacity: 0.6,
	},
});
