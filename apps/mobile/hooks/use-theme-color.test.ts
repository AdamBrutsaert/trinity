import { Colors } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";

const mockUseColorScheme = jest.fn<string | null, []>();

jest.mock("@/hooks/use-color-scheme", () => ({
	useColorScheme: () => mockUseColorScheme(),
}));

describe("useThemeColor", () => {
	beforeEach(() => {
		mockUseColorScheme.mockReset();
	});

	it("returns explicit light/dark props when provided", () => {
		mockUseColorScheme.mockReturnValue("dark");
		expect(
			useThemeColor({ light: "#aaa", dark: "#bbb" }, "text"),
		).toBe("#bbb");
	});

	it("falls back to theme Colors when prop missing", () => {
		mockUseColorScheme.mockReturnValue("light");
		expect(useThemeColor({}, "background")).toBe(Colors.light.background);
	});
});
