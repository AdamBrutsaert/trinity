import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";

import { client } from "@/lib/api";

const TOKEN_KEY = "@trinity_token";
const PROFILE_KEY = "@trinity_profile";

export interface User {
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber: string | null;
	avatarId: number | null;
}

interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
}

export const useAuthStore = create<AuthState>(() => ({
	user: null,
	token: null,
	loading: true,
}));

export async function initializeAuth() {
	try {
		const [token, profileJson] = await Promise.all([
			AsyncStorage.getItem(TOKEN_KEY),
			AsyncStorage.getItem(PROFILE_KEY),
		]);

		if (token && profileJson) {
			const profile = JSON.parse(profileJson) as User; // TODO: validate shape
			useAuthStore.setState({
				user: profile,
				token,
				loading: false,
			});
		} else {
			useAuthStore.setState({ loading: false });
		}
	} catch (error) {
		console.error("Failed to restore auth state:", error);
		useAuthStore.setState({ loading: false });
	}
}

export function useLogin() {
	return useMutation({
		mutationFn: (data: { email: string; password: string }) => {
			return client.auth.login.post(data);
		},
		onMutate: () => {
			useAuthStore.setState({ loading: true });
		},
		onSuccess: async (response) => {
			if (response.data) {
				const user: User = {
					email: response.data.user.email,
					firstName: response.data.user.firstName,
					lastName: response.data.user.lastName,
					phoneNumber: response.data.user.phoneNumber,
					avatarId: null,
				};
				await Promise.all([
					AsyncStorage.setItem(TOKEN_KEY, response.data.token),
					AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(user)),
				]);
				useAuthStore.setState({
					user,
					token: response.data.token,
					loading: false,
				});
			}
		},
	});
}

export function useRegister() {
	return useMutation({
		mutationFn: async (data: {
			email: string;
			password: string;
			firstName: string;
			lastName: string;
			phoneNumber?: string;
		}) => {
			return client.auth.register.post(data);
		},
		onMutate: () => {
			useAuthStore.setState({ loading: true });
		},
		onSuccess: async (response) => {
			if (response.data) {
				const user: User = {
					email: response.data.user.email,
					firstName: response.data.user.firstName,
					lastName: response.data.user.lastName,
					phoneNumber: response.data.user.phoneNumber || null,
					avatarId: null,
				};
				await Promise.all([
					AsyncStorage.setItem(TOKEN_KEY, response.data.token),
					AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(user)),
				]);
				useAuthStore.setState({
					user,
					token: response.data.token,
					loading: false,
				});
			}
		},
	});
}

export function useLogout() {
	return useMutation({
		mutationFn: async () => {
			await Promise.all([
				AsyncStorage.removeItem(TOKEN_KEY),
				AsyncStorage.removeItem(PROFILE_KEY),
			]);
			useAuthStore.setState({
				user: null,
				token: null,
				loading: false,
			});
		},
	});
}

export function useUpdateProfile() {
	const { token } = useAuthStore();

	return useMutation({
		mutationFn: async (data: {
			email: string;
			firstName: string;
			lastName: string;
			phoneNumber: string | null;
			avatarId: number | null;
		}) => {
			return client.users.me.put(
				{
					email: data.email,
					firstName: data.firstName,
					lastName: data.lastName,
					phoneNumber: data.phoneNumber,
					address: null,
					zipCode: null,
					city: null,
					country: null,
				},
				{ headers: { Authorization: `Bearer ${token}` } },
			);
		},
		onSuccess: async (response, variables) => {
			if (response.data) {
				const user: User = {
					email: response.data.email,
					firstName: response.data.firstName,
					lastName: response.data.lastName,
					phoneNumber: response.data.phoneNumber,
					avatarId: variables.avatarId,
				};
				await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(user));
				useAuthStore.setState((state) => ({
					...state,
					user,
				}));
			}
		},
	});
}
