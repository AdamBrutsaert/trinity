import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthGate } from "@/features/auth/AuthGate";
import { initializeAuth, useAuthStore } from "@/features/auth/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { styles } from "@/styles/root-layout.styles";

export const queryClient = new QueryClient();

export default function RootLayout() {
	const colorScheme = useColorScheme();

	useEffect(() => {
		initializeAuth();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<SafeAreaProvider>
				<ThemeProvider
					value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
				>
					<RootLayoutNav />
				</ThemeProvider>
			</SafeAreaProvider>
		</QueryClientProvider>
	);
}

function RootLayoutNav() {
	const { loading } = useAuthStore();

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<>
			<AuthGate />
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen
					name="modal"
					options={{ presentation: "modal", title: "Modal" }}
				/>
			</Stack>
			<StatusBar style="auto" />
		</>
	);
}
