import { treaty } from "@elysiajs/eden";
import type App from "@trinity/api";
import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const API_PORT = 3000;

function getDevServerHost(): string | null {
	const hostUri: unknown =
		Constants?.expoConfig?.hostUri ??
		Constants?.manifest?.debuggerHost ??
		Constants?.manifest2?.extra?.expoClient?.hostUri;

	if (typeof hostUri === "string" && hostUri.length > 0) {
		const match = hostUri.match(
			/^(?:https?:\/\/|exp:\/\/)?([^:/?#]+)(?::\d+)?/i,
		);
		if (match?.[1]) return match[1];
	}

	const scriptURL = NativeModules?.SourceCode?.scriptURL;
	if (typeof scriptURL !== "string") return null;

	const httpMatch = scriptURL.match(/^https?:\/\/([^:/?#]+)(?::\d+)?/i);
	if (httpMatch?.[1]) return httpMatch[1];

	const expMatch = scriptURL.match(/^exp:\/\/([^:/?#]+)(?::\d+)?/i);
	if (expMatch?.[1]) return expMatch[1];

	return null;
}

function normalizeBaseUrl(url: string): string {
	return url.endsWith("/") ? url.slice(0, -1) : url;
}

function computeApiBaseUrl(): string {
	const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
	if (typeof fromEnv === "string" && fromEnv.length > 0)
		return normalizeBaseUrl(fromEnv);

	if (__DEV__) {
		const host = getDevServerHost();
		if (host) return `http://${host}:${API_PORT}`;
	}

	if (Platform.OS === "android") return `http://10.0.2.2:${API_PORT}`;
	return `http://localhost:${API_PORT}`;
}

export const client = treaty<typeof App>(computeApiBaseUrl());
