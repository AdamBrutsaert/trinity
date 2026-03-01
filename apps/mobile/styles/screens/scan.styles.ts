import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F9",
	},
	screen: {
		flex: 1,
		padding: 20,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
	},
	backPill: {
		backgroundColor: "#111",
		borderRadius: 999,
		paddingVertical: 10,
		paddingHorizontal: 14,
	},
	backPillText: {
		color: "#fff",
		fontWeight: "800",
	},
	title: {
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
	},
	spacer: {
		width: 90,
	},
	scannerBlock: {
		flex: 1,
	},
});
