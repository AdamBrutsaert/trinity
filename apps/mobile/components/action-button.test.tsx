import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import { ActionButton } from "./action-button";

describe("ActionButton", () => {
	test("renders title and subtitle", () => {
		const { getByText } = render(
			<ActionButton title="Settings" subtitle="Manage" onPress={() => {}} />,
		);
		expect(getByText("Settings")).toBeTruthy();
		expect(getByText("Manage")).toBeTruthy();
	});

	test("calls onPress when pressed", () => {
		const onPress = jest.fn();
		const { getByRole } = render(
			<ActionButton title="Settings" subtitle="Manage" onPress={onPress} />,
		);
		fireEvent.press(getByRole("button"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("renders icon when provided", () => {
		function FakeIcon() {
			return <Text testID="icon">icon</Text>;
		}
		const { getByTestId } = render(
			<ActionButton
				title="Settings"
				subtitle="Manage"
				onPress={() => {}}
				Icon={FakeIcon as any}
			/>,
		);
		expect(getByTestId("icon")).toBeTruthy();
	});
});
