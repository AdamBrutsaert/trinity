const path = require("node:path");

const jestExpoPreset = require("jest-expo/jest-preset");

const bunStoreNodeModules = path.join(__dirname, "../../node_modules/.bun/node_modules");
const babelJest = require.resolve("babel-jest", {
	paths: [__dirname, bunStoreNodeModules],
});
const babelPresetExpo = require.resolve("babel-preset-expo", {
	paths: [__dirname, bunStoreNodeModules],
});

const presetTransform = { ...jestExpoPreset.transform };
for (const [pattern, transformer] of Object.entries(presetTransform)) {
	if (transformer === "babel-jest") {
		presetTransform[pattern] = babelJest;
		continue;
	}

	if (Array.isArray(transformer) && transformer[0] === "babel-jest") {
		presetTransform[pattern] = [babelJest, ...transformer.slice(1)];
	}
}

/** @type {import('jest').Config} */
module.exports = {
	...jestExpoPreset,
	preset: "jest-expo",
	moduleDirectories: [
		"node_modules",
		"<rootDir>/../../node_modules/.bun/node_modules",
	],
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/$1",
	},
	transform: {
		...presetTransform,
		"^.+\\.[jt]sx?$": [
			babelJest,
			{
				presets: [babelPresetExpo],
			},
		],
	},
	transformIgnorePatterns: [
		"node_modules/(?!\\.bun/)(?!((jest-)?react-native|@react-native|expo(nent)?|expo-.*|@expo(nent)?|expo-router|@react-navigation|react-native-svg|react-native-reanimated|react-native-worklets)/)",
		"node_modules/\\.bun/[^/]+/node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|expo-.*|@expo(nent)?|expo-router|@react-navigation|react-native-svg|react-native-reanimated|react-native-worklets)/)",
	],
	collectCoverageFrom: [
		"components/action-button.tsx",
		"components/cart-purchase-bar.tsx",
		"components/cart-summary-card.tsx",
		"components/external-link.tsx",
		"components/primary-button.tsx",
		"components/profile-text-field.tsx",
		"components/quantity-stepper.tsx",
		"components/themed-text.tsx",
		"components/themed-view.tsx",
		"lib/*.{ts,tsx}",
		"!lib/api.ts",
		"hooks/*.{ts,tsx}",
		"!**/*.d.ts",
		"!**/*.test.{ts,tsx}",
		"!**/__tests__/**",
		"!**/*.styles.{ts,tsx}",
	],
	coverageReporters: ["text", "lcov"],
	coverageDirectory: "coverage",
	coverageThreshold: {
		global: {
			lines: 20,
			statements: 20,
		},
	},
	reporters: [
		"default",
		[
			"jest-junit",
			{
				outputDirectory: "<rootDir>/test-results",
				outputName: "junit.xml",
			},
		],
	],
};
