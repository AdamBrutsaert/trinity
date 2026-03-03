import { render, fireEvent } from "@testing-library/react-native";

import { ProfileTextField } from "./profile-text-field";

describe("ProfileTextField", () => {
	test("renders label and value", () => {
		const { getByText, getByDisplayValue } = render(
			<ProfileTextField
				label="Email"
				value="a@b.com"
				onChangeText={() => {}}
			/>,
		);
		expect(getByText("Email")).toBeTruthy();
		expect(getByDisplayValue("a@b.com")).toBeTruthy();
	});

	test("calls onChangeText", () => {
		const onChangeText = jest.fn();
		const { getByDisplayValue } = render(
			<ProfileTextField
				label="Email"
				value="a@b.com"
				onChangeText={onChangeText}
			/>,
		);
		fireEvent.changeText(getByDisplayValue("a@b.com"), "c@d.com");
		expect(onChangeText).toHaveBeenCalledWith("c@d.com");
	});

	test("is not editable when disabled", () => {
		const { getByDisplayValue } = render(
			<ProfileTextField
				label="Email"
				value="a@b.com"
				onChangeText={() => {}}
				disabled
			/>,
		);
		expect(getByDisplayValue("a@b.com").props.editable).toBe(false);
	});
});
