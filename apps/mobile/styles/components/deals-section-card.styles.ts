import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		overflow: "hidden",
	},
	cardPromo: {
		borderColor: "rgba(212, 0, 42, 0.35)",
	},
	cardForYou: {
		borderColor: "#EFEFF3",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		padding: 14,
	},
	headerLeft: {
		flex: 1,
	},
	pill: {
		alignSelf: "flex-start",
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		marginBottom: 10,
	},
	pillPromo: {
		backgroundColor: "#D4002A",
	},
	pillForYou: {
		backgroundColor: "#F1F1F5",
	},
	pillText: {
		fontWeight: "900",
		fontSize: 12,
		letterSpacing: 0.4,
	},
	pillTextPromo: {
		color: "#fff",
	},
	pillTextForYou: {
		color: "#D4002A",
	},
	title: {
		fontSize: 16,
		fontWeight: "900",
		color: "#111",
	},
	subtitle: {
		marginTop: 4,
		fontSize: 12,
		color: "#666",
		lineHeight: 16,
	},
	chevronWrap: {
		width: 34,
		height: 34,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		backgroundColor: "#F7F7F9",
		alignItems: "center",
		justifyContent: "center",
	},
	chevron: {
		fontSize: 26,
		fontWeight: "900",
		color: "#111",
		transform: [{ rotate: "0deg" }],
		marginTop: -2,
	},
	chevronOpen: {
		transform: [{ rotate: "90deg" }],
	},
	body: {
		paddingHorizontal: 14,
		paddingBottom: 14,
	},
});
