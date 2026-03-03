import { render } from "@testing-library/react-native";

import { ThemedView } from "@/components/themed-view";

jest.mock("@/hooks/use-theme-color", () => ({
	useThemeColor: () => "#00ff00",
}));

describe("ThemedView", () => {
	it("applies themed backgroundColor", () => {
		const { getByTestId } = render(<ThemedView testID="view" />);
		expect(getByTestId("view")).toHaveStyle({ backgroundColor: "#00ff00" });
	});
});
