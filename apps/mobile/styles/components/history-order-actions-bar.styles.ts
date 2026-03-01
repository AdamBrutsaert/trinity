import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: 20,
		right: 20,
	},
	card: {
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
	closePill: {
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: "#111",
		alignItems: "center",
		justifyContent: "center",
	},
	closeText: {
		color: "#fff",
		fontWeight: "900",
		letterSpacing: 0.2,
	},
	buttonWrap: {
		minWidth: 140,
	},
});
