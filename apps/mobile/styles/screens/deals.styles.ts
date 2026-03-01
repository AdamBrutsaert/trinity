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
		marginBottom: 12,
	},
	backPill: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		backgroundColor: "#fff",
	},
	backPillText: {
		fontWeight: "900",
		color: "#111",
	},
	title: {
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
	},
	spacer: {
		width: 64,
	},
	content: {
		gap: 12,
		paddingBottom: 24,
	},
	hintCard: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	hintLabel: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
	},
	hintTitle: {
		marginTop: 6,
		fontSize: 16,
		fontWeight: "900",
		color: "#111",
	},
	hintBody: {
		marginTop: 6,
		fontSize: 12,
		color: "#666",
		lineHeight: 17,
	},
	hintEmphasis: {
		color: "#D4002A",
		fontWeight: "900",
	},
});
