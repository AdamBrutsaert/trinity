import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	section: {
		marginTop: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#111",
		marginBottom: 10,
	},
	promoRow: {
		flexDirection: "row",
		gap: 12,
	},
	promoCard: {
		flex: 1,
		borderRadius: 16,
		padding: 14,
		borderWidth: 1,
	},
	promoCardLeft: {
		marginRight: 0,
	},
	promoCardPrimary: {
		backgroundColor: "#D4002A",
		borderColor: "#D4002A",
	},
	promoCardSecondary: {
		backgroundColor: "#fff",
		borderColor: "#EFEFF3",
	},
	promoPill: {
		alignSelf: "flex-start",
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		marginBottom: 10,
	},
	promoPillPrimary: {
		backgroundColor: "rgba(255, 255, 255, 0.22)",
	},
	promoPillSecondary: {
		backgroundColor: "#F1F1F5",
	},
	promoPillText: {
		fontWeight: "900",
		fontSize: 12,
		letterSpacing: 0.4,
	},
	promoPillTextPrimary: {
		color: "#fff",
	},
	promoPillTextSecondary: {
		color: "#D4002A",
	},
	promoTitle: {
		fontSize: 16,
		fontWeight: "900",
		marginBottom: 4,
		color: "#fff",
	},
	promoTitleAlt: {
		color: "#111",
	},
	promoBody: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.92)",
	},
	promoBodyAlt: {
		color: "#444",
	},
	recoList: {
		marginTop: 12,
		backgroundColor: "#fff",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		overflow: "hidden",
	},
	recoItem: {
		flexDirection: "row",
		gap: 10,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderTopWidth: 1,
		borderTopColor: "#F1F1F5",
	},
	recoDot: {
		width: 10,
		height: 10,
		borderRadius: 10,
		marginTop: 4,
		backgroundColor: "#D4002A",
	},
	recoTexts: {
		flex: 1,
	},
	recoTitle: {
		fontSize: 14,
		fontWeight: "900",
		color: "#111",
	},
	recoReason: {
		marginTop: 2,
		fontSize: 12,
		color: "#666",
	},
});
