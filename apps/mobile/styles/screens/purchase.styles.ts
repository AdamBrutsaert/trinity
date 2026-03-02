import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F9",
	},
	screen: {
		flex: 1,
		padding: 24,
	},
	centerBlock: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	loadingTitle: {
		marginTop: 16,
		fontSize: 17,
		fontWeight: "700",
		color: "#111",
		textAlign: "center",
	},
	loadingSubtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
	},
	// Icon circles
	successIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#111",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	successIconText: {
		fontSize: 32,
		color: "#fff",
		fontWeight: "900",
	},
	cancelIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#E5E5EA",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	cancelIconText: {
		fontSize: 28,
		color: "#666",
		fontWeight: "700",
	},
	errorIcon: {
		width: 72,
		height: 72,
		borderRadius: 36,
		backgroundColor: "#FF3B30",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
	},
	errorIconText: {
		fontSize: 36,
		color: "#fff",
		fontWeight: "900",
	},
	// Text
	title: {
		fontSize: 22,
		fontWeight: "900",
		color: "#111",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 15,
		color: "#666",
		textAlign: "center",
		lineHeight: 22,
		paddingHorizontal: 16,
	},
	// Buttons
	primaryButton: {
		marginTop: 16,
		backgroundColor: "#111",
		borderRadius: 999,
		paddingVertical: 14,
		paddingHorizontal: 36,
		width: "100%",
		alignItems: "center",
	},
	primaryButtonText: {
		color: "#fff",
		fontWeight: "800",
		fontSize: 15,
	},
	secondaryButton: {
		marginTop: 8,
		borderRadius: 999,
		paddingVertical: 14,
		paddingHorizontal: 36,
		width: "100%",
		alignItems: "center",
		backgroundColor: "#E5E5EA",
	},
	secondaryButtonText: {
		color: "#111",
		fontWeight: "700",
		fontSize: 15,
	},
});
