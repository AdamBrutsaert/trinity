import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	button: {
		borderRadius: 999,
		paddingVertical: 12,
		paddingHorizontal: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	primary: {
		backgroundColor: "#D4002A",
	},
	primaryDisabled: {
		opacity: 0.5,
	},
	text: {
		color: "#fff",
		fontWeight: "900",
		letterSpacing: 0.2,
	},
});
