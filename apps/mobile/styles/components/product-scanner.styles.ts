import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderRadius: 18,
		overflow: "hidden",
		backgroundColor: "#111",
		borderWidth: 1,
		borderColor: "#EFEFF3",
	},
	camera: {
		flex: 1,
	},
	permissionContainer: {
		flex: 1,
		backgroundColor: "#F7F7F9",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	permissionCard: {
		width: "100%",
		maxWidth: 520,
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 16,
	},
	permissionTitle: {
		fontSize: 18,
		fontWeight: "900",
		color: "#111",
		marginBottom: 6,
	},
	permissionBody: {
		fontSize: 13,
		color: "#444",
		lineHeight: 18,
	},
	permissionButton: {
		marginTop: 12,
		backgroundColor: "#111",
		borderRadius: 999,
		paddingVertical: 12,
		paddingHorizontal: 14,
		alignSelf: "flex-start",
	},
	permissionButtonText: {
		color: "#fff",
		fontWeight: "800",
	},
	hintPill: {
		position: "absolute",
		bottom: 14,
		left: 14,
		right: 14,
		backgroundColor: "rgba(17, 17, 17, 0.62)",
		borderRadius: 999,
		paddingVertical: 10,
		paddingHorizontal: 14,
	},
	hintText: {
		color: "#fff",
		fontWeight: "800",
		textAlign: "center",
	},
});
