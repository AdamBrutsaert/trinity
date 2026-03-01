import React, {
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { authService, type RegisterInput } from "@/features/auth/authService";

export type AuthUser = {
	authenticated: true;
	email?: string;
	firstName?: string;
	lastName?: string;
	phoneNumber?: string;
	avatarId?: number;
};

export type AuthContextValue = {
	user: AuthUser | null;
	token: string | null;
	loading: boolean;
	isAuthenticated: boolean;
	login: (
		email: string,
		password: string,
	) => Promise<{ success: true } | { success: false; error: string }>;
	register: (
		input: RegisterInput,
	) => Promise<{ success: true } | { success: false; error: string }>;
	updateProfile: (
		patch: Partial<Omit<AuthUser, "authenticated">>,
	) => Promise<void>;
	logout: () => Promise<void>;
};

const PROFILE_KEY = "@trinity_profile";

function toStoredProfile(
	user: AuthUser | null,
): Partial<Omit<AuthUser, "authenticated">> {
	if (!user) return {};
	const { email, firstName, lastName, phoneNumber, avatarId } = user;
	return {
		...(typeof email === "string" ? { email } : null),
		...(typeof firstName === "string" ? { firstName } : null),
		...(typeof lastName === "string" ? { lastName } : null),
		...(typeof phoneNumber === "string" ? { phoneNumber } : null),
		...(typeof avatarId === "number" ? { avatarId } : null),
	};
}

async function readStoredProfile(): Promise<
	Partial<Omit<AuthUser, "authenticated">>
> {
	try {
		const raw = await AsyncStorage.getItem(PROFILE_KEY);
		if (!raw) return {};
		const data = JSON.parse(raw) as any;
		if (!data || typeof data !== "object") return {};

		const profile: Partial<Omit<AuthUser, "authenticated">> = {};
		if (typeof data.email === "string") profile.email = data.email;
		if (typeof data.firstName === "string") profile.firstName = data.firstName;
		if (typeof data.lastName === "string") profile.lastName = data.lastName;
		if (typeof data.phoneNumber === "string")
			profile.phoneNumber = data.phoneNumber;
		if (typeof data.avatarId === "number") profile.avatarId = data.avatarId;
		return profile;
	} catch (e) {
		console.error("Failed to read stored profile:", e);
		return {};
	}
}

async function writeStoredProfile(user: AuthUser | null): Promise<void> {
	try {
		if (!user) {
			await AsyncStorage.removeItem(PROFILE_KEY);
			return;
		}
		const profile = toStoredProfile(user);
		await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
	} catch (e) {
		console.error("Failed to store profile:", e);
	}
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function restore() {
			try {
				const storedToken = await authService.getToken();
				if (cancelled) return;

				if (storedToken) {
					setToken(storedToken);
					const storedProfile = await readStoredProfile();
					if (cancelled) return;
					setUser({ authenticated: true, ...storedProfile });
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		void restore();
		return () => {
			cancelled = true;
		};
	}, []);

	const value = useMemo<AuthContextValue>(() => {
		return {
			user,
			token,
			loading,
			isAuthenticated: Boolean(token),
			async login(email, password) {
				const result = await authService.login(email, password);
				if (!result.success) return result;

				setToken(result.token);
				const nextUser: AuthUser = { authenticated: true, email };
				setUser(nextUser);
				void writeStoredProfile(nextUser);
				return { success: true };
			},
			async register(input) {
				const result = await authService.register(input);
				if (!result.success) return result;

				setToken(result.token);
				const nextUser: AuthUser = {
					authenticated: true,
					email: input.email,
					firstName: input.firstName,
					lastName: input.lastName,
					phoneNumber: input.phoneNumber,
				};
				setUser(nextUser);
				void writeStoredProfile(nextUser);
				return { success: true };
			},
			async updateProfile(patch) {
				setUser((prev) => {
					const base: AuthUser = prev?.authenticated
						? prev
						: { authenticated: true };
					const next: AuthUser = { ...base, ...patch, authenticated: true };
					void writeStoredProfile(next);
					return next;
				});
			},
			async logout() {
				await authService.logout();
				setToken(null);
				setUser(null);
				void writeStoredProfile(null);
			},
		};
	}, [user, token, loading]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
	return ctx;
}
