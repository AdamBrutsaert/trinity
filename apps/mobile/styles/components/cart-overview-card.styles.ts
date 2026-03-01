import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	row: {
		flexDirection: "row",
		alignItems: "stretch",
		gap: 14,
	},
	leftCol: {
		flex: 1,
		justifyContent: "space-between",
		gap: 12,
	},
	rightCol: {
		width: "46%",
		justifyContent: "center",
		alignItems: "flex-start",
		paddingLeft: 10,
	},
	label: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
	},
	total: {
		marginTop: 6,
		fontSize: 22,
		fontWeight: "900",
		color: "#111",
	},
	items: {
		marginTop: 2,
		fontSize: 12,
		color: "#666",
	},
	scanPill: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#111",
		borderRadius: 999,
		paddingVertical: 10,
		paddingHorizontal: 12,
		alignSelf: "flex-start",
	},
	scanPillText: {
		color: "#fff",
		fontWeight: "900",
	},
	tipTitle: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
	},
	tipText: {
		marginTop: 6,
		fontSize: 12,
		color: "#666",
		lineHeight: 17,
	},
	tipEmphasis: {
		color: "#D4002A",
		fontWeight: "900",
	},
});
