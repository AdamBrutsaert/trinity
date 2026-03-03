import { render } from "@testing-library/react-native";

import { ThemedText } from "@/components/themed-text";

jest.mock("@/hooks/use-theme-color", () => ({
	useThemeColor: () => "#ff0000",
}));

describe("ThemedText", () => {
	it("applies themed color", () => {
		const { getByText } = render(<ThemedText>hello</ThemedText>);
		expect(getByText("hello")).toHaveStyle({ color: "#ff0000" });
	});

	it("applies type styles", () => {
		const { getByText } = render(<ThemedText type="title">title</ThemedText>);
		expect(getByText("title")).toHaveStyle({ fontSize: 32 });
	});
});
