import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: 20,
		right: 20,
	},
	bar: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 14 },
		shadowOpacity: 0.12,
		shadowRadius: 22,
		elevation: 8,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	left: {
		flex: 1,
	},
	label: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.4,
		color: "#666",
	},
	total: {
		marginTop: 4,
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
	},
	buttonWrap: {
		minWidth: 140,
	},
});
