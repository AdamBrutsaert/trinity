import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	title: {
		fontSize: 15,
		fontWeight: "900",
		color: "#111",
	},
	subtitle: {
		marginTop: 4,
		fontSize: 12,
		color: "#666",
	},
	price: {
		fontSize: 14,
		fontWeight: "900",
		color: "#111",
	},
	bottomRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 12,
	},
	removePill: {
		borderRadius: 999,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: "#D4002A",
		backgroundColor: "rgba(212, 0, 42, 0.08)",
	},
	removeText: {
		color: "#D4002A",
		fontWeight: "900",
	},
});
