import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/styles/screens/purchase.styles";

export default function PurchaseScreen() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.screen}>
				<Text style={styles.text}>WIP payment page</Text>
			</View>
		</SafeAreaView>
	);
}
