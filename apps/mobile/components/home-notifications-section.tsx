import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { styles } from "@/styles/components/home-notifications-section.styles";

export type HomeNotification = {
	id: string;
	title: string;
	body: string;
};

export function HomeNotificationsSection({
	title,
	notifications,
	onPressNotification,
}: {
	title: string;
	notifications: HomeNotification[];
	onPressNotification: (notification: HomeNotification) => void;
}) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>
			{notifications.map((notification) => (
				<TouchableOpacity
					key={notification.id}
					style={styles.notificationCard}
					onPress={() => onPressNotification(notification)}
					accessibilityRole="button"
					activeOpacity={0.85}
				>
					<Text style={styles.notificationTitle}>{notification.title}</Text>
					<Text style={styles.notificationBody}>{notification.body}</Text>
				</TouchableOpacity>
			))}
		</View>
	);
}
