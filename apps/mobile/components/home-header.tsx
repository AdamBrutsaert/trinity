import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/home-header.styles";

export function HomeHeader({
	firstName,
	onLogout,
}: {
	firstName: string | null;
	onLogout: () => void;
}) {
	return (
		<View style={styles.header}>
			<View style={styles.headerTopRow}>
				<View style={styles.headerTitles}>
					<Text style={styles.brand}>Trinity</Text>
					{firstName ? (
						<Text style={styles.subtitle}>Hi, {firstName}</Text>
					) : null}
				</View>

				<TouchableOpacity
					onPress={onLogout}
					accessibilityRole="button"
					style={styles.logoutPill}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					activeOpacity={0.8}
				>
					<Text style={styles.logoutPillText}>Log out</Text>
				</TouchableOpacity>
			</View>

			<View style={styles.headerDivider} />
		</View>
	);
}
