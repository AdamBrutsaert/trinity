import "@testing-library/jest-native/extend-expect";

// Recommended mocks for React Native animation libs.
jest.mock("react-native-worklets", () => ({
	useSharedValue: (v: unknown) => ({ value: v }),
	createSerializable: (value: unknown) => value,
}));
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
