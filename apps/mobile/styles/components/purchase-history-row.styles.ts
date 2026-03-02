import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	topRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	date: {
		fontSize: 14,
		fontWeight: "700",
		color: "#111",
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
	badgeText: {
		fontSize: 11,
		fontWeight: "900",
		letterSpacing: 0.4,
		color: "#111",
	},
	total: {
		marginTop: 10,
		fontSize: 20,
		fontWeight: "900",
		color: "#111",
	},
	orderId: {
		marginTop: 4,
		fontSize: 11,
		color: "#AAA",
	},
});
