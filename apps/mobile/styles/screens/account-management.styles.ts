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
		marginBottom: 16,
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
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 28,
		gap: 12,
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 18,
		borderWidth: 1,
		borderColor: "#EFEFF3",
		padding: 14,
	},
	cardTitle: {
		fontSize: 12,
		fontWeight: "900",
		letterSpacing: 0.5,
		color: "#666",
		marginBottom: 12,
	},
	profileRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	avatarBig: {
		width: 64,
		height: 64,
		borderRadius: 999,
		borderWidth: 0,
		overflow: "hidden",
		backgroundColor: "#111",
		alignItems: "center",
		justifyContent: "center",
	},
	avatarBigImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
		borderRadius: 999,
	},
	avatarInitials: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
	profileMain: {
		flex: 1,
	},
	name: {
		fontSize: 16,
		fontWeight: "900",
		color: "#111",
	},
	email: {
		marginTop: 4,
		fontSize: 12,
		color: "#666",
	},
	muted: {
		marginTop: 8,
		fontSize: 12,
		color: "#666",
		lineHeight: 17,
	},
	mutedEmphasis: {
		color: "#D4002A",
		fontWeight: "900",
	},
	fields: {
		gap: 12,
	},
	footer: {
		marginTop: 4,
		gap: 8,
	},
	footerHint: {
		fontSize: 12,
		color: "#666",
		lineHeight: 17,
	},
});
