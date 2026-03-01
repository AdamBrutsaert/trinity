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
	title: {
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
	},
	subtitle: {
		marginTop: 6,
		fontSize: 12,
		color: "#666",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
		marginBottom: 10,
	},
	headerTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 12,
	},
	headerLeft: {
		flex: 1,
	},
	badge: {
		borderRadius: 999,
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		backgroundColor: "#F7F7F9",
	},
	badgePaid: {
		borderColor: "#D4002A",
		backgroundColor: "rgba(212, 0, 42, 0.08)",
	},
	badgePending: {
		borderColor: "#111",
		backgroundColor: "rgba(17, 17, 17, 0.06)",
	},
	badgeRefunded: {
		borderColor: "#666",
		backgroundColor: "rgba(102, 102, 102, 0.08)",
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 0.4,
		color: "#111",
	},
	metaRow: {
		marginTop: 12,
		gap: 6,
	},
	metaLabel: {
		fontSize: 12,
		color: "#666",
	},
	metaValue: {
		fontSize: 12,
		color: "#111",
		fontWeight: "900",
	},
	totalRow: {
		marginTop: 12,
		flexDirection: "row",
		alignItems: "baseline",
		justifyContent: "space-between",
		gap: 12,
	},
	totalLabel: {
		fontSize: 12,
		color: "#666",
		fontWeight: "900",
		letterSpacing: 0.4,
	},
	totalValue: {
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
	},
	tip: {
		marginTop: 10,
		fontSize: 12,
		color: "#666",
		lineHeight: 17,
	},
	tipEmphasis: {
		color: "#D4002A",
		fontWeight: "900",
	},
	content: {
		gap: 12,
	},
	lineItemsCard: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	lineItemsFooter: {
		borderTopWidth: 1,
		borderTopColor: "#EFEFF3",
		paddingTop: 12,
		marginTop: 10,
	},
});
