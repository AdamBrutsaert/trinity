import { render } from "@testing-library/react-native";
import React from "react";

import { ExternalLink } from "@/components/external-link";

const mockOpenBrowserAsync = jest.fn(async () => undefined);

jest.mock("expo-web-browser", () => ({
	openBrowserAsync: (...args: unknown[]) => mockOpenBrowserAsync(...args),
	WebBrowserPresentationStyle: { AUTOMATIC: "AUTOMATIC" },
}));

jest.mock("expo-router", () => ({
	Link: ({ onPress, children, ...props }: any) =>
		require("react").createElement(
			require("react-native").Text,
			{ testID: "external-link", onPress, ...props },
			children,
		),
}));

describe("ExternalLink", () => {
	const originalExpoOs = process.env.EXPO_OS;

	afterEach(() => {
		process.env.EXPO_OS = originalExpoOs;
		mockOpenBrowserAsync.mockClear();
	});

	it("opens in-app browser on native", async () => {
		process.env.EXPO_OS = "ios";

		const { getByTestId } = render(
			<ExternalLink href="https://example.com">go</ExternalLink>,
		);

		const preventDefault = jest.fn();
		await getByTestId("external-link").props.onPress({ preventDefault });

		expect(preventDefault).toHaveBeenCalled();
		expect(mockOpenBrowserAsync).toHaveBeenCalledWith("https://example.com", {
			presentationStyle: "AUTOMATIC",
		});
	});
});
