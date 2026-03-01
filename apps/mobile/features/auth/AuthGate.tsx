import { useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/features/auth/AuthContext";

export function AuthGate() {
	const { loading, isAuthenticated } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		const root = segments[0];
		const inAuth = root === "login" || root === "register";

		if (!isAuthenticated && !inAuth) {
			router.replace("/login");
			return;
		}

		if (isAuthenticated && inAuth) {
			router.replace("/");
		}
	}, [isAuthenticated, loading, router, segments]);

	return null;
}
