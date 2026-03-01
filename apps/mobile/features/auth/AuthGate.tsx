import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store";

export function AuthGate() {
	const { user, loading } = useAuthStore();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		// Wait for auth state to be initialized
		if (loading) return;

		const root = segments[0];
		const inAuth = root === "login" || root === "register";

		if (!user && !inAuth) {
			router.replace("/login");
			return;
		}

		if (user && inAuth) {
			router.replace("/");
		}
	}, [user, loading, router, segments]);

	return null;
}
