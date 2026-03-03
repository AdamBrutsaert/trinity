import { render, fireEvent } from "@testing-library/react-native";

import { PrimaryButton } from "./primary-button";

describe("PrimaryButton", () => {
	test("renders the title", () => {
		const { getByText } = render(
			<PrimaryButton title="Buy" onPress={() => {}} />,
		);
		expect(getByText("Buy")).toBeTruthy();
	});

	test("calls onPress when pressed", () => {
		const onPress = jest.fn();
		const { getByRole } = render(
			<PrimaryButton title="Buy" onPress={onPress} />,
		);
		fireEvent.press(getByRole("button"));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	test("does not call onPress when disabled", () => {
		const onPress = jest.fn();
		const { getByRole } = render(
			<PrimaryButton title="Buy" onPress={onPress} disabled />,
		);
		fireEvent.press(getByRole("button"));
		expect(onPress).toHaveBeenCalledTimes(0);
	});
});
